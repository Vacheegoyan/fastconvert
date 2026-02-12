# Դեպլոյ և սանդղակավորում — շատ օգտատերերի դեպքում կայքի կայուն աշխատանք

Երբ դոմեյն սերվերում կայքը բաց եք անում և միաժամանակ շատ օգտատերեր են մուտք գործում, հետևյալ քայլերը կօգնեն կայքը չկորցնի իր բնականոն աշխատանքը։

---

## 1. Հոսթինգի ընտրություն

### VPS (սեփական սերվեր) — **խորհուրդ է տրվում ձեր դեպքում**

- Կայքը օգտագործում է **FFmpeg / Python (yt-dlp)** ներբեռնումների համար — ծանր CPU աշխատանք։
- Vercel/Netlify-ի serverless-ը **չի** հարմար, քանի որ FFmpeg-ը պետք է սերվերում տեղադրված լինի, և execution time-ը սահմանափակ է։
- **VPS** (DigitalOcean, Hetzner, Linode, OVH և այլն) — 2–4 CPU, 4–8 GB RAM — հարմար է միջին բեռի համար։

### Ինչ անել VPS-ում

- Տեղադրել **Node.js** (LTS), **Python 3**, **FFmpeg**, **Nginx** (reverse proxy + SSL).
- Կայքը chroot-ով կամ Docker-ով չի պարտադիր, բայց **PM2**-ով աշխատացնել Next.js-ը — **պարտադիր**, որպեսզի պրոցեսը վերագործարկվի խափանումների դեպքում։

---

## 2. Միաժամանակյա ներբեռնումների սահմանափակում (concurrency)

Շատ օգտատերեր միաժամանակ «Ներբեռնել» սեղմելիս **մի բացեք անսահմանափակ Python/FFmpeg պրոցեսներ** — սերվերը կարող է «կախվել»։

- Նախագծում արդեն ավելացված է **concurrency limiter** (`lib/concurrency.ts`) — միաժամանակ ընդամենը **2–3** conversion (prepare/prepare_poster) աշխատում են, մնացածը սպասում են հերթում։
- Այս արժեքը (`MAX_CONCURRENT_CONVERSIONS`) կարող եք փոխել `lib/concurrency.ts`-ում՝ ըստ սերվերի CPU/RAM-ի (2–4 հատ խորհուրդ է տրվում)։

Արդյունքը — CPU-ն չի ճնշվում, կայքը մնում է արձագանքող։

---

## 3. Rate limiting — Redis (production)

- Այժմ rate limit-ը **in-memory** է (`lib/rate-limit.ts`). Մի VPS-ում, մեկ Node պրոցեսի դեպքում դա բավարար է։
- Եթե ապագայում **մի քանի instance** (կամ մի քանի սերվեր) բացեք, ապա **Redis**-ով rate limit անելու կ need — օրինակ **Upstash Redis** (Vercel-ի հետ) կամ սեփական Redis VPS-ում։  
  Կոդում արդեն նշված է production-ի համար Redis-ի օգտագործումը (`lib/rate-limit.ts`-ի մեկնաբանություն)։

---

## 4. Nginx — reverse proxy, SSL, cache

Nginx-ը դնում եք Node-ի **դիմաց** (front). Նա.

- Ընդունում է 80/443 (SSL) և փոխանցում Next.js-ին (օր. `http://127.0.0.1:3000`).
- Կարող է cache անել **ստատիկ ֆայլեր** (`/_next/static`, `/favicon`, և այլն) — նվազեցնում է բեռը Node-ի վրա։
- Կարող է **gzip/brotli** compression անել։

Օրինակ minimal config (SSL-ը կարող եք Let's Encrypt-ով):

```nginx
# Upstream for Next.js
upstream nextjs {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name yourdomain.com;
    # Redirect to HTTPS (after SSL is set)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Optional: cache static assets
    location /_next/static {
        proxy_pass http://nextjs;
        proxy_cache_valid 60m;
    }
}
```

---

## 5. PM2 — պրոցեսի մենեջեր

Next.js-ը **միայն** `node`/`next start`-ով երկար աշխատացնելը ռիսկային է (crash-ի դեպքում կանգ է առնում)։

- Տեղադրել PM2: `npm install -g pm2`
- Build: `pnpm build` (կամ `npm run build`)
- Աշխատացնել: `pm2 start pnpm --name "yt1" -- start` (կամ `pm2 start npm --name "yt1" -- run start`)
- Ավտոմատ վերագործարկում և մեքենայի վերամեկնարկից հետո աշխատեցնելու համար: `pm2 save` և `pm2 startup`

Արդյունքը — կայքը մշտապես աշխատում է և crash-ից հետո ինքն իրեն վերագործարկվում է։

---

## 6. Մոնիտորինգ

- **PM2** — `pm2 monit` / `pm2 logs` — տեսնել CPU, memory, logs։
- **Uptime** — արտաքին սերվիս (UptimeRobot, Better Uptime և այլն) — րոպեներով ստուգել, որ կայքը բաց է։
- **Լոգեր** — Nginx access/error logs, Next.js/PM2 logs — դանդաղ կամ 429/500 պատրաստությունները տեսնելու համար։

---

## 7. Դատաբազա և analytics

- Այժմ analytics-ը **JSON ֆայլ** է (`data/analytics.json`). Փոքր և միջին բեռի համար դա ընդունելի է։
- Եթե օգտատերերի թիվը և հարցումների ծավալը մեծանան — արժե անցնել **SQLite / PostgreSQL** (կամ արտաքին analytics) և rate limit-ը Redis-ով միացնել, ինչպես նշված է վերևում։

---

## 8. Հակիրճ checklist

| Քայլ | Նպատակ |
|------|--------|
| VPS + Node, Python, FFmpeg, Nginx | Հոսթինգ և անհրաժեշտ ծրագրեր |
| PM2-ով `next start` | Կայուն աշխատանք, ավտո-վերագործարկում |
| Nginx reverse proxy + SSL | Անվտանգություն, ստատիկ cache |
| Concurrency limiter (նախագծում) | Միաժամանակ 2–4 conversion — CPU չճնշել |
| Rate limit (in-memory մեկ instance-ի համար) | Սպամ/abuse-ի նվազեցում |
| PM2 + uptime մոնիտորինգ | Արագ արձագանք խափանումներին |

Այս քայլերով, դոմեյն սերվերում և միաժամանակ շատ օգտատերերի դեպքում կայքը կարող է աշխատել կայուն, առանց «կախվելու»։
