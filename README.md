# Tapyy Review Experience — MVP

A mobile-first review flow prototype for two Tapyy NFC/QR cards.

## Demo cards
- `1-123ab` → Café
- `2-456cd` → Hotel

## Run
Open `index.html` directly, or serve the folder:

```bash
python -m http.server 3000
```

Then open:
- `http://localhost:3000/?card=1-123ab`
- `http://localhost:3000/?card=2-456cd`

The app also accepts `/r/CARD_ID` when served by a web server with SPA fallback.

## Important next production work
1. Replace placeholder business names and Google review URLs.
2. Store card/business mappings in PostgreSQL/Supabase.
3. Move AI generation to a server-side API; never expose an AI key in browser code.
4. Add event tracking and dashboard analytics.
5. Use the real Google review URL for each business.
6. Keep customer-generated reviews genuine and do not suppress low ratings or selectively route only positive ratings to Google.
