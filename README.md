# Weekly Grocery Planner

Plan a week of meals (typed in or suggested from a built-in library) and turn
the plan into an aisle-grouped grocery list. Data is saved in your browser —
no account needed. Share the deployed link; each person gets their own space.

## Features

- **Plan your week** — add meals by suggestion ("Suggest a dinner") or pick a
  specific one. Set servings and toggle leftovers per meal; add beverages.
- **Smart grocery list** — every ingredient rolled up and grouped by store
  aisle. Nothing is ever hidden: long-lasting items (noodles, rice, spices) get
  a 🟡 "check before buying" flag, and you can tap "already have" to strike an
  item without removing it.
- **Meal library** — browse the built-in meals or add your own.
- **Pantry** — track staples you already own (salt, oil, etc. come pre-loaded).

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # run unit tests
npm run build    # production build into dist/
```

## Deploy (Netlify)

1. Push this repo to GitHub.
2. In Netlify: **Add new site → Import from GitHub** → pick this repo.
3. Build settings are read from `netlify.toml` (build `npm run build`, publish
   `dist`).
4. Deploy. Share the resulting URL — each visitor gets their own private data,
   stored in their browser.

## Notes

- Data lives in your browser's `localStorage`, so it won't sync between devices
  in this version.
