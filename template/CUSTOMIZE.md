# How to make a site for a new client (10–15 minutes)

This template is built so you can spin up a site per client fast. You mainly
edit **one file** (`config.js`), drop in a few photos, and you're done.

## Step 1 — Duplicate the folder
Copy the whole `template/` folder and rename it for the client,
e.g. `clients/salon-nordlys/`. Keep `template/` as your clean master.

## Step 2 — Edit `config.js` (the important one)
Open `config.js` and change the values:
- **businessName, tagline, heroSubtitle** — the headline text.
- **businessType** — pick the closest one (HairSalon, Restaurant, Plumber,
  Electrician, Bakery, BeautySalon, AutoRepair, Store, LocalBusiness). This
  helps them show up correctly in Google.
- **phoneDisplay / phoneDial** — display is what people see; dial is the same
  number with no spaces (used for click-to-call).
- **email, address, mapsQuery** — contact details. The map fills in by itself.
- **hours** — opening times (use empty `""` for closed days).
- **theme** — the brand colors. Change `primary` and the whole site re-colors.

That alone gives a working, branded, click-to-call site.

## Step 3 — Edit the wording in `index.html`
Two things live in HTML so Google can read them (good for ranking):
- **Services** — the four cards in the `SERVICES` section. Change icon (emoji),
  title, text, and price. Add/remove cards freely.
- **About** + the page **description** (the `<meta name="description">` near the
  top — write 1 sentence with the town + service).

## Step 4 — Add photos
Put images in the `assets/` folder, then in `styles.css`:
- **Hero background:** find `.hero` and replace the `background:` line with
  `background: url('assets/hero.jpg') center/cover;`
- **About photo:** `.about-photo` → `background: url('assets/about.jpg') center/cover;`
- **Gallery:** each `.gallery-item` can get its own
  `background: url('assets/gallery1.jpg') center/cover;`
  (give them individual classes or use inline styles).

No photos yet? It still looks clean with the built-in colored placeholders.

## Step 5 — Make the contact form deliver (optional)
By default the form opens the visitor's email app. To collect submissions
properly, create a free form at <https://formspree.io>, copy its endpoint URL,
and paste it into `formEndpoint` in `config.js`.

## Step 6 — Put it online
It's plain HTML/CSS/JS — host it anywhere:
- **Netlify** or **Cloudflare Pages** (free): drag-and-drop the folder.
- **GitHub Pages** (free).
- Any normal web host: upload the files.
Then point the client's domain at it.

## Selling points to mention on calls
- Loads fast, looks great on phones (most local searches are mobile).
- "Tap to call" button always visible on mobile.
- Built-in Google "local business" data → better chance of showing in search.
- You can update their hours/prices/photos any time (that's the rental value).
