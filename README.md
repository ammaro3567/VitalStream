# VitalStream

A static blood-bank / emergency-routing demo: vanilla HTML, CSS, and JavaScript with [Supabase](https://supabase.com/) for data and admin auth.

## Project layout

- `index.html` — home page
- `style.css`, `contact.html`, `contact.js` — shared styles and contact page
- `assets/` — images (e.g. hero)
- `Admin/` — admin dashboard (`admin.html`, `admin.css`, `admin.js`)
- `Donate/`, `Emergancy/`, `login/`, `Search/` — feature pages

## Local preview

Serve the repo root over HTTP (avoid opening `file://` URLs for Supabase):

```bash
python -m http.server 5500
```

Then open `http://127.0.0.1:5500/`.

## Clone

```bash
git clone https://github.com/ammaro3567/VitalStream.git
cd VitalStream
```

## Configuration

Supabase URL and anon keys live in the relevant `.js` files (donate, emergency, login, admin, search). Rotate keys and enable RLS appropriately before production.
