# Կայքի տեղադրում սերվերում (GitHub-ից clone արած)

Քայլ առ քայլ — Ubuntu 24.04 (DigitalOcean Droplet կամ այլ VPS), երբ repo-ն արդեն clone արած ես GitHub-ից։

---

## Նախապայման

- Repo-ն clone արած է, օրինակ: `/var/www/yt1` (կամ `~/yt1`).
- Root կամ sudo հասանելիություն։

---

## 1. Թարմացնել package ցանկը

```bash
sudo apt update
```

---

## 2. Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version   # v20.x.x
```

---

## 3. Python 3, pip, FFmpeg

```bash
sudo apt install -y python3 python3-pip python3-venv ffmpeg
python3 --version
ffmpeg -version
```

---

## 4. Նախագծի թղթապանակ

```bash
cd /var/www/yt1   # կամ ձեր path, որտեղ clone արած ես
pwd
git status        # (optional) համոզվել որ ամեն ինչ արդի է
```

---

## 5. Next.js (frontend) — dependencies + build

```bash
cd /var/www/yt1
npm ci
cp .env.example .env
nano .env         # կամ vi .env
```

**.env-ում** դիր.

- `NEXT_PUBLIC_SITE_URL=https://yourdomain.com` (առանց trailing slash)
- `ADMIN_PASSWORD=ձեր-անվտանգ-գաղտնաբառ`

Պահպանել և դուրս գալ։

```bash
npm run build
```

Սպասվող: build-ը հաջող ավարտվի (exit 0)։

---

## 6. Python backend — venv + dependencies

```bash
cd /var/www/yt1/python-backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

(Առաջին անգամ եթե `requirements.txt` չկա: `pip install fastapi "uvicorn[standard]" slowapi "yt-dlp[default]"`)

Ստուգում.

```bash
python -c "from yt import YouTubeDownloader; from app import app; print('OK')"
deactivate
```

---

## 7. PM2 — Next.js + Python backend միասին

Նախ տեղադրել PM2 (եթե չկա).

```bash
sudo npm install -g pm2
```

**Next.js (port 3000):**

```bash
cd /var/www/yt1
pm2 start npm --name "yt-next" -- start
```

**Python backend (port 8000):**

```bash
cd /var/www/yt1/python-backend
pm2 start .venv/bin/uvicorn --name "yt-api" -- --host 0.0.0.0 --port 8000 app:app
```

Ստուգում.

```bash
pm2 list
pm2 logs yt-next --lines 5
pm2 logs yt-api --lines 5
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/info
```

(3000 → 200, 8000/info → POST է, GET-ին 405 կարող է լինել — նորմալ):

**PM2-ը reboot-ի ժամանակ ավտոմատ:**

```bash
pm2 startup
pm2 save
```

(Հրամանը կտա մեկ տող `sudo env ...` — copy-paste արեք և run արեք):

---

## 8. Nginx — reverse proxy (HTTPS + domain)

Եթե domain ունես (օր. `yourdomain.com`) և ցանկանում ես HTTPS.

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
sudo nano /etc/nginx/sites-available/yt1
```

Մեջը (փոխարինել `yourdomain.com`):

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Պահպանել, enable, reload.

```bash
sudo ln -sf /etc/nginx/sites-available/yt1 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

HTTPS (Let's Encrypt).

```bash
sudo certbot --nginx -d yourdomain.com
```

Կայքը բացել `https://yourdomain.com` — Next.js-ը արդեն 3000-ում է, `/api/download`-ը Next.js API route-ով գնում է `http://localhost:8000` (Python backend)։

---

## 9. yt-dlp-ը YouTube-ի հետ (optional, բայց խորհուրդ)

Որպեսզի download/preview աշխատի YouTube-ից (signature solving, bot check):

- Տես **SERVER-SETUP-YT-DLP.md** — Node 20, `yt-dlp[default]`, optional cookies.txt:
  - Python venv-ում արդեն `yt-dlp[default]` է (requirements.txt-ում):
  - Միայն համոզվել, որ `node` հասանելի է PATH-ում (`which node`), և optional `python-backend/cookies.txt` (Netscape format) դնել։

---

## 10. Ամփոփ — հրամանների ցանկ (copy-paste)

Ենթադրելով project path `/var/www/yt1` և root/sudo:

```bash
apt update
apt install -y python3 python3-pip python3-venv ffmpeg nginx certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

cd /var/www/yt1
npm ci
cp .env.example .env
# Խմբագրել .env: NEXT_PUBLIC_SITE_URL, ADMIN_PASSWORD
npm run build

cd /var/www/yt1/python-backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
deactivate

npm install -g pm2
cd /var/www/yt1
pm2 start npm --name "yt-next" -- start
cd /var/www/yt1/python-backend
pm2 start .venv/bin/uvicorn --name "yt-api" -- --host 0.0.0.0 --port 8000 app:app
pm2 startup
pm2 save
```

Դրանից հետո Nginx config (domain + HTTPS) — ինչպես քայլ 8-ում։

---

## Խնդիրների լուծում

| Խնդիր | Լուծում |
|--------|--------|
| `npm run build` ձախողվում է | `node --version` 20.x, `rm -rf .next node_modules && npm ci && npm run build` |
| Preview/download չի աշխատում | Python backend-ը 8000-ում է? `curl -X POST http://127.0.0.1:8000/info -H "Content-Type: application/json" -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'`. Տես SERVER-SETUP-YT-DLP.md |
| 502 Bad Gateway | `pm2 list`, `pm2 restart yt-next yt-api`, `sudo nginx -t && sudo systemctl reload nginx` |
| Կայքը չի բացվում | Firewall: `sudo ufw allow 80 && sudo ufw allow 443 && sudo ufw enable` (եթե ufw օգտագործում ես) |
