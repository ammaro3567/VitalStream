# VitalStream

Static blood-bank demo: HTML, CSS, and JavaScript only. Data is **fake** and stored in the browser with `demo-store.js` (localStorage). There is no server database.

## Layout

- `demo-store.js` — seed data and `localStorage` read/write (`VitalStreamDemo` API)
- `index.html`, `style.css`, `contact.html`, `contact.js` — home and contact
- `assets/` — images
- `Admin/` — admin dashboard
- `Donate/`, `Emergancy/`, `login/`, `Search/` — other pages

## Local preview

```bash
python -m http.server 5500
```

Open `http://127.0.0.1:5500/`.

## Reset demo data

In the browser console:

```js
VitalStreamDemo.reset()
```

Or clear site data for the origin.

## Clone

```bash
git clone https://github.com/ammaro3567/VitalStream.git
cd VitalStream
```
