# Weekly Grocery Planner — Design Spec

**Date:** 2026-06-04
**Status:** Approved design, pre-implementation

## Purpose

A simple, shareable web app that helps plan a week of meals and turn that plan
into a smart grocery list. The user can either supply their own meal ideas or
have the app suggest meals from a built-in library. From the chosen meals, the
app builds an aisle-grouped grocery list that always shows everything needed,
while flagging long-lasting items the user may already own.

Default serving size is 2 people.

## Core Decisions (locked)

1. **Meal entry is both, on-demand.** Per meal, the user either types their own
   idea or taps "Suggest for me" to pull one from the library.
2. **Suggestions come from a curated library now; live AI later.** The app ships
   with a starter library of real meals whose ingredients are pre-mapped.
   Architecture leaves a clean seam to add live AI generation later (not in v1).
3. **Shareable static web app.** Each person who opens the link gets their own
   private space; data lives in their browser. No accounts, no server, free to
   host. Sharing = sending the URL.
4. **Independent shopping lists per person** is the v1 model. Sharing a finished
   list with a specific person (e.g. the user's wife) is a future nice-to-have,
   not built in v1, but the data model should not preclude it.

## Weekly Planning Flow

1. **Start a new week** → blank plan.
2. **Add meals.** For each meal the user chooses:
   - **Type** — breakfast, lunch, or dinner
   - **Servings** — defaults to 2; can be raised for guests
   - **Leftovers?** — if yes, that meal's ingredients double (cooks one extra
     meal of the same size); this is the `leftoverMultiplier = 2` used below
   - **Source** — typed in by the user, or pulled via "Suggest for me"
3. **Add beverages.** A separate quick list (coffee, sparkling water, juice,
   wine, etc.), not tied to meals; added directly to the grocery list.
4. **Generate the grocery list.** The app rolls up every ingredient across all
   meals (scaled for servings + leftovers), adds beverages, groups by store
   aisle, and applies the flagging rules below.
5. **Use it / share it.** Check items off while shopping. (Future: send the
   finished list to another person.)

## Grocery List Philosophy (important)

**Nothing is ever subtracted or hidden from the list.** The list is always a
complete picture of everything the chosen meals need. Guidance is layered on top
via flags and taps — never by removing items.

- **Perishable items** (lettuce, chicken, milk, etc.) → always listed plain,
  every week, with no flag. Always bought fresh.
- **Long-lasting items** (noodles, rice, spices, oil, canned goods, etc.) →
  always listed too, but visually flagged, e.g.:
  > 🟡 Spaghetti noodles — *you may already have these. Check before buying.*

  The flag is a nudge to verify stock; the item is never removed.
- **"✓ already have that" tap** is available on any item. Ticking it marks the
  item as struck-through/greyed **in place** — it stays visible on the list.
  It is a note to self, not a deletion.

This replaces any earlier "subtract pantry items from the list" idea. The pantry
concept still exists as a place for known staples (see below), but its effect on
the list is to *flag*, never to remove.

## Screens

1. **This Week** — the current plan. Add meals (type, servings, leftovers, or
   "Suggest for me"), add beverages, see the week at a glance. Primary action:
   "Generate Grocery List."
2. **Grocery List** — the rolled-up list grouped by aisle, with 🟡 long-lasting
   flags and "✓ already have" taps. This is the screen taken shopping.
3. **Meal Library** — browse/search built-in meals and add custom meals. Each
   meal shows its ingredients.
4. **Pantry** — a running, editable list of staples the user owns. Common
   staples (salt, pepper, oil, basic spices) are pre-loaded.

## Data Model

Stored in browser `localStorage`:

- **Meal** — `{ id, name, type (breakfast|lunch|dinner), ingredients[] }`
  where each ingredient is `{ name, quantity, unit, aisle, shelfLife
  (perishable|long-lasting) }`. Quantities are expressed for 2 servings.
- **Meals library** — the seeded meals plus any user-added meals.
- **Week plan** — the chosen meals (each with chosen servings + leftovers flag)
  and the beverage list for the current week.
- **Pantry** — list of staple items the user currently owns.

### Derived: grocery list generation

For each planned meal, scale ingredient quantities by
`servings / 2 * (leftovers ? leftoverMultiplier : 1)`, sum like-ingredients
across meals, add beverages, group by `aisle`, and tag each long-lasting item
with the "check before buying" flag. Items present in the pantry are also
flagged (not removed).

## Tech Stack

- **Vite + React + Tailwind** — single-page app. `npm run dev` to develop,
  `npm run build` to ship.
- **localStorage** for all persistence — no server, no accounts, no cost.
- **Netlify** deploy from a GitHub repo — push to deploy; yields the shareable
  link.
- **Seed library** of ~30–40 real meals (breakfasts/lunches/dinners) with
  ingredients pre-tagged perishable vs. long-lasting and assigned an aisle,
  structured so adding meals is easy.

## Out of Scope (v1)

- User accounts / cross-device sync (localStorage only in v1).
- Live AI meal generation (library only; clean seam left for later).
- Sharing a finished list with a specific person (data model leaves room).
- Nutrition info, pricing, store integration.

## Future Hooks (design leaves room, not built)

- Live AI suggestion endpoint slotting in alongside the library picker.
- Optional accounts + sync if cross-device becomes desired.
- "Share this list" export/link for sending a finished list to another person.
