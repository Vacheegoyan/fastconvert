# Սերվերի տեղադրում (Ubuntu 24.04) — yt-dlp + Node.js + cookies

Այս ուղեցույցը նախատեսված է DigitalOcean Droplet (Ubuntu 24.04)‑ի համար, որպեսզի yt-dlp‑ը կարողանա YouTube‑ից ստանալ video/audio format‑ներ, signature solving‑ը աշխատի Node.js‑ով, և cookies‑ը ճիշտ կարդացվի (bot check շրջանցում)։

Բոլոր հրամանները run արեք **root**‑ով (`sudo -i` կամ `sudo` յուրաքանչյուր հրամանից առաջ)։

---

## 1. Թարմացնել package ցանկը

```bash
apt update
```

---

## 2. Node.js 20 (LTS) — եթե դեռ չկա

Եթե `node --version` արդեն 20.x է, կարող եք բաց թողնել այս քայլը։

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node --version   # պետք է լինի v20.x.x
which node       # սովորաբար /usr/bin/node
```

---

## 3. Python 3, pip, FFmpeg

```bash
apt install -y python3 python3-pip python3-venv ffmpeg
ffmpeg -version
```

---

## 4. yt-dlp (pip‑ով, `[default]` extra — EJS/signature decipher)

```bash
python3 -m pip install --break-system-packages -U "yt-dlp[default]"
```

Կամ եթե աշխատում եք venv‑ում (խորհուրդ է տրվում).

```bash
# Օրինակ project root‑ում
python3 -m venv .venv
source .venv/bin/activate
pip install -U "yt-dlp[default]"
```

Ստուգում.

```bash
yt-dlp --version
```

---

## 5. Node.js‑ը որպես JavaScript runtime (signature solving)

yt-dlp‑ը by default միայն Deno‑ն է միացնում։ Node‑ն միացնելու համար.

**Տարբերակ A — համակարգի Node (արդեն տեղադրած)**

Պարզապես համոզվեք, որ `node` հասանելի է PATH‑ում.

```bash
which node
# Օրինակ: /usr/bin/node
```

Կոդում (python-backend) արդեն ավելացված է `js_runtimes: "node"` (կամ `node:/usr/bin/node`), այդ պատճառով լրացուցիչ հրաման չի պետք։

**Տարբերակ B — yt-dlp config ֆայլ (CLI‑ից run անելիս)**

Եթե yt-dlp‑ը run եք անում CLI‑ից.

```bash
mkdir -p /etc/yt-dlp
echo '--js-runtimes node' >> /etc/yt-dlp.conf
# կամ user config
mkdir -p ~/.config/yt-dlp
echo '--js-runtimes node' >> ~/.config/yt-dlp/config
```

Մեր դեպքում Python backend‑ը ինքը փոխանցում է `js_runtimes` option‑ը, այնպես որ config ֆայլը optional է։

---

## 6. Cookies ֆայլ (bot check / sign-in շրջանցում)

- Cookies‑ը պետք է լինի **Netscape format** (տող `# Netscape HTTP Cookie File` և տողեր `domain	flag	path	secure	expiration	name	value`).
- Ֆայլի անունը նախագծում՝ `cookies.txt`, տեղը՝ `python-backend/cookies.txt`.

Սերվերում.

```bash
# Օրինակ project path
cd /var/www/yt1/python-backend   # կամ ձեր path
nano cookies.txt
```

Մեջը paste արեք browser extension‑ից export արած cookies (Netscape format)։ Պահպանել և դուրս գալ։

Թույլատրելիություն.

```bash
chmod 600 cookies.txt
```

Ստուգում (առաջին տողը).

```bash
head -1 python-backend/cookies.txt
# Պետք է լինի: # Netscape HTTP Cookie File
```

Backend‑ի կոդը ինքը ստուգում է `python-backend/cookies.txt` path‑ը և, եթե ֆայլը կա, ավտոմատ ավելացնում է `cookiefile` option‑ը։

---

## 7. YouTube extractor — web client (cookies‑ի հետ աշխատելու համար)

Backend‑ում արդեն ավելացված է.

`extractor_args: "youtube:player_client=web,default"`

Սերվերում լրացուցիչ հրաման չի պետք։ Եթե CLI‑ից եք փորձում.

```bash
yt-dlp --extractor-args "youtube:player_client=web,default" --cookies /path/to/cookies.txt -F "https://www.youtube.com/watch?v=VIDEO_ID"
```

---

## 8. Ամփոփ ստուգում

```bash
# Node
node --version
which node

# yt-dlp + default extra
python3 -m pip show yt-dlp

# Cookies path (project‑ի path‑ով)
ls -la /var/www/yt1/python-backend/cookies.txt   # ձեր path

# Փորձ (ոչ ներբեռնում, միայն format ցանկ)
yt-dlp --extractor-args "youtube:player_client=web,default" --cookies /var/www/yt1/python-backend/cookies.txt --js-runtimes node -F "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

Սպասվող. format ցանկում video/audio տողեր (ոչ միայն images)։ Եթե դեռ "Only images" է — cookies‑ը թարմացրեք (նոր export browser‑ից) կամ ստուգեք, որ `cookies.txt`‑ը Netscape format է և path‑ը ճիշտ է։

---

## 9. Հակիրճ հրամանների ցանկ (copy-paste)

```bash
apt update
apt install -y python3 python3-pip python3-venv ffmpeg

# Node 20 (եթե չկա)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# yt-dlp with default extra (EJS/signature)
python3 -m pip install --break-system-packages -U "yt-dlp[default]"

# Ստուգում
node --version
which node
yt-dlp --version
```

Դրանից հետո.

1. Դրեք `cookies.txt` (Netscape format) `python-backend/cookies.txt` path‑ում։
2. Restart արեք Python backend‑ը (uvicorn/gunicorn)։
3. Backend‑ը արդեն օգտագործում է `cookiefile`, `extractor_args` և `js_runtimes node` — լրացուցիչ config չի պետք։

---

## Խնդիրների լուծում

| Խնդիր | Լուծում |
|--------|--------|
| "No supported JavaScript runtime" | Տեղադրել Node 20, համոզվել `which node` աշխատում է, backend‑ում `js_runtimes` արդեն կա |
| "Sign in to confirm you're not a bot" | Թարմ cookies (Netscape) `python-backend/cookies.txt`‑ում, `player_client=web,default` արդեն կա |
| "Only images are available" | Signature solving — Node + `yt-dlp[default]`; cookies ճիշտ path‑ում և format‑ով |
| "Signature solving failed" | `pip install -U "yt-dlp[default]"`, Node 20, `--js-runtimes node` (backend‑ում արդեն կա) |
