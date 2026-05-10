# VitalStream

Static blood-bank demo: HTML, CSS, and JavaScript only. **No database and no shared “demo store”** — numbers and tables on the admin and search pages are mostly plain markup; scripts only handle UI actions (filters, form confirmations, adding a row, and similar).

## Layout

- `index.html`, `style.css`, `contact.html`, `contact.js` — home and contact
- `assets/` — images
- `Admin/` — admin dashboard
- `Donate/`, `Emergancy/`, `login/`, `Search/` — other pages

## Local preview

```bash
python -m http.server 5500
```

Open `http://127.0.0.1:5500/`.

## Clone

```bash
git clone https://github.com/ammaro3567/VitalStream.git
cd VitalStream
```
