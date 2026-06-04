# Weekly Grocery Planner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a shareable static web app that plans a week of meals (typed in or suggested from a built-in library) and turns the plan into an aisle-grouped grocery list that flags long-lasting items the user may already own.

**Architecture:** A Vite + React + TypeScript single-page app. All planning logic lives in pure, unit-tested functions (`src/lib/`). UI is thin React components reading/writing state that persists to `localStorage`. No server, no accounts. Deployed as a static build to Netlify.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS v3, Vitest + @testing-library/react, jsdom.

---

## File Structure

```
grocery-planner/
  index.html
  package.json
  vite.config.ts            # vite + vitest config
  tailwind.config.js
  postcss.config.js
  src/
    main.tsx                # React entry
    App.tsx                 # app shell + tab navigation
    index.css               # tailwind directives
    lib/
      types.ts              # all shared types
      scaling.ts            # scaleIngredient() pure fn
      groceryList.ts        # generateGroceryList() pure fn
      storage.ts            # localStorage load/save helpers
      id.ts                 # makeId() helper
    data/
      seedMeals.ts          # built-in meal library
      staples.ts            # pre-loaded pantry staples
    hooks/
      usePlannerState.ts    # top-level state + persistence wiring
    components/
      ThisWeek.tsx          # screen 1
      GroceryList.tsx       # screen 2
      MealLibrary.tsx       # screen 3
      Pantry.tsx            # screen 4
  src/lib/*.test.ts         # colocated unit tests
```

Files that change together live together. Pure logic (`lib/`) is fully unit-tested; UI components get lighter render/interaction tests.

---

## Task 0: Project scaffold

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `tailwind.config.js`, `postcss.config.js`

- [ ] **Step 1: Scaffold Vite React-TS project**

Run from `/Users/jamajeffmd/grocery-planner`:
```bash
npm create vite@latest . -- --template react-ts
```
If prompted that the directory is not empty, choose "Ignore files and continue" (the `docs/` and `.git` already there must be preserved).

- [ ] **Step 2: Install dependencies**

```bash
npm install
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
npm install -D tailwindcss@^3 postcss autoprefixer
npx tailwindcss init -p
```

- [ ] **Step 3: Configure Tailwind**

Overwrite `tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
```

Overwrite `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4: Configure Vitest**

Overwrite `vite.config.ts`:
```ts
/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test-setup.ts",
  },
});
```

Create `src/test-setup.ts`:
```ts
import "@testing-library/jest-dom";
```

- [ ] **Step 5: Add test + format scripts**

In `package.json`, ensure the `scripts` block contains:
```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 6: Sanity-check the toolchain**

Replace `src/App.tsx` with a minimal shell:
```tsx
export default function App() {
  return <h1 className="text-2xl font-bold p-4">Weekly Grocery Planner</h1>;
}
```
Ensure `src/main.tsx` imports `./index.css`. Run:
```bash
npm run build
```
Expected: build succeeds with no TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + TS + Tailwind + Vitest"
```

---

## Task 1: Shared types

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/id.ts`

- [ ] **Step 1: Define types**

Create `src/lib/types.ts`:
```ts
export type MealType = "breakfast" | "lunch" | "dinner";
export type ShelfLife = "perishable" | "long-lasting";
export type Aisle =
  | "produce"
  | "meat"
  | "dairy"
  | "bakery"
  | "frozen"
  | "pantry"
  | "beverages"
  | "other";

/** A single ingredient. Quantities are stated for BASE_SERVINGS (2) people. */
export interface Ingredient {
  name: string;
  quantity: number;
  unit: string; // e.g. "lb", "oz", "cup", "" for countless items
  aisle: Aisle;
  shelfLife: ShelfLife;
}

export interface Meal {
  id: string;
  name: string;
  type: MealType;
  ingredients: Ingredient[];
}

/** A meal placed into a week, with chosen servings + leftovers. */
export interface PlannedMeal {
  id: string; // unique within the week
  meal: Meal; // snapshot of the chosen meal
  servings: number;
  leftovers: boolean;
}

export interface Beverage {
  id: string;
  name: string;
}

export interface WeekPlan {
  meals: PlannedMeal[];
  beverages: Beverage[];
}

export interface PantryItem {
  id: string;
  name: string;
}

export interface GroceryItem {
  name: string;
  quantity: number;
  unit: string;
  aisle: Aisle;
  shelfLife: ShelfLife;
  /** true when long-lasting OR matched in the pantry: "check before buying". */
  mayAlreadyHave: boolean;
}

export interface GroceryListSection {
  aisle: Aisle;
  items: GroceryItem[];
}

export const BASE_SERVINGS = 2;
export const LEFTOVER_MULTIPLIER = 2;
```

- [ ] **Step 2: Add id helper**

Create `src/lib/id.ts`:
```ts
/** Stable unique id for client-side entities. */
export function makeId(): string {
  return crypto.randomUUID();
}
```

- [ ] **Step 3: Type-check**

Run:
```bash
npx tsc -b
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts src/lib/id.ts
git commit -m "feat: add shared types and id helper"
```

---

## Task 2: Ingredient scaling (pure fn, TDD)

**Files:**
- Create: `src/lib/scaling.ts`
- Test: `src/lib/scaling.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/scaling.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { scaleIngredient } from "./scaling";
import type { Ingredient } from "./types";

const noodles: Ingredient = {
  name: "Spaghetti noodles",
  quantity: 8,
  unit: "oz",
  aisle: "pantry",
  shelfLife: "long-lasting",
};

describe("scaleIngredient", () => {
  it("returns base quantity for 2 servings, no leftovers", () => {
    expect(scaleIngredient(noodles, 2, false).quantity).toBe(8);
  });

  it("scales by servings relative to base of 2", () => {
    expect(scaleIngredient(noodles, 4, false).quantity).toBe(16);
    expect(scaleIngredient(noodles, 1, false).quantity).toBe(4);
  });

  it("doubles when leftovers is true", () => {
    expect(scaleIngredient(noodles, 2, true).quantity).toBe(16);
  });

  it("combines servings and leftovers", () => {
    expect(scaleIngredient(noodles, 4, true).quantity).toBe(32);
  });

  it("preserves name, unit, aisle, shelfLife", () => {
    const out = scaleIngredient(noodles, 4, false);
    expect(out).toMatchObject({
      name: "Spaghetti noodles",
      unit: "oz",
      aisle: "pantry",
      shelfLife: "long-lasting",
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- scaling`
Expected: FAIL — `scaleIngredient` is not defined.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/scaling.ts`:
```ts
import { BASE_SERVINGS, LEFTOVER_MULTIPLIER } from "./types";
import type { Ingredient } from "./types";

/** Scale a base (2-serving) ingredient for chosen servings + leftovers. */
export function scaleIngredient(
  ingredient: Ingredient,
  servings: number,
  leftovers: boolean,
): Ingredient {
  const factor =
    (servings / BASE_SERVINGS) * (leftovers ? LEFTOVER_MULTIPLIER : 1);
  return { ...ingredient, quantity: ingredient.quantity * factor };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- scaling`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/scaling.ts src/lib/scaling.test.ts
git commit -m "feat: add ingredient scaling for servings and leftovers"
```

---

## Task 3: Grocery list generation (pure fn, TDD)

**Files:**
- Create: `src/lib/groceryList.ts`
- Test: `src/lib/groceryList.test.ts`

This is the core of the app: roll up all planned meals, aggregate duplicate ingredients, add beverages, group by aisle, and flag items the user may already have.

- [ ] **Step 1: Write the failing test**

Create `src/lib/groceryList.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { generateGroceryList } from "./groceryList";
import type { WeekPlan, PantryItem, Ingredient, Meal } from "./types";

function meal(name: string, ingredients: Ingredient[]): Meal {
  return { id: name, name, type: "dinner", ingredients };
}

const pasta = meal("Pasta", [
  { name: "Spaghetti noodles", quantity: 8, unit: "oz", aisle: "pantry", shelfLife: "long-lasting" },
  { name: "Tomato", quantity: 2, unit: "", aisle: "produce", shelfLife: "perishable" },
]);

const salad = meal("Salad", [
  { name: "Tomato", quantity: 1, unit: "", aisle: "produce", shelfLife: "perishable" },
  { name: "Olive oil", quantity: 2, unit: "tbsp", aisle: "pantry", shelfLife: "long-lasting" },
]);

const plan: WeekPlan = {
  meals: [
    { id: "p1", meal: pasta, servings: 2, leftovers: false },
    { id: "p2", meal: salad, servings: 2, leftovers: false },
  ],
  beverages: [{ id: "b1", name: "Sparkling water" }],
};

describe("generateGroceryList", () => {
  it("aggregates the same ingredient across meals (same name + unit)", () => {
    const sections = generateGroceryList(plan, []);
    const produce = sections.find((s) => s.aisle === "produce")!;
    const tomato = produce.items.find((i) => i.name === "Tomato")!;
    expect(tomato.quantity).toBe(3); // 2 + 1
  });

  it("groups items by aisle", () => {
    const sections = generateGroceryList(plan, []);
    const aisles = sections.map((s) => s.aisle);
    expect(aisles).toContain("produce");
    expect(aisles).toContain("pantry");
    expect(aisles).toContain("beverages");
  });

  it("flags long-lasting items as mayAlreadyHave", () => {
    const sections = generateGroceryList(plan, []);
    const pantry = sections.find((s) => s.aisle === "pantry")!;
    const noodles = pantry.items.find((i) => i.name === "Spaghetti noodles")!;
    expect(noodles.mayAlreadyHave).toBe(true);
  });

  it("does NOT flag perishable items by default", () => {
    const sections = generateGroceryList(plan, []);
    const produce = sections.find((s) => s.aisle === "produce")!;
    const tomato = produce.items.find((i) => i.name === "Tomato")!;
    expect(tomato.mayAlreadyHave).toBe(false);
  });

  it("flags a perishable item when it is in the pantry (case-insensitive)", () => {
    const pantry: PantryItem[] = [{ id: "x", name: "tomato" }];
    const sections = generateGroceryList(plan, pantry);
    const produce = sections.find((s) => s.aisle === "produce")!;
    const tomato = produce.items.find((i) => i.name === "Tomato")!;
    expect(tomato.mayAlreadyHave).toBe(true);
  });

  it("includes beverages in the beverages aisle and never removes them", () => {
    const sections = generateGroceryList(plan, []);
    const bev = sections.find((s) => s.aisle === "beverages")!;
    expect(bev.items.map((i) => i.name)).toContain("Sparkling water");
  });

  it("scales aggregated quantities by servings and leftovers", () => {
    const scaled: WeekPlan = {
      meals: [{ id: "p1", meal: pasta, servings: 4, leftovers: true }],
      beverages: [],
    };
    const sections = generateGroceryList(scaled, []);
    const noodles = sections
      .find((s) => s.aisle === "pantry")!
      .items.find((i) => i.name === "Spaghetti noodles")!;
    expect(noodles.quantity).toBe(32); // 8 * (4/2) * 2
  });

  it("returns sections in canonical aisle order", () => {
    const sections = generateGroceryList(plan, []);
    const order = sections.map((s) => s.aisle);
    const expected = ["produce", "pantry", "beverages"];
    // relative order preserved per AISLE_ORDER
    expect(order).toEqual(
      expected.sort(
        (a, b) =>
          ["produce", "meat", "dairy", "bakery", "frozen", "pantry", "beverages", "other"].indexOf(a) -
          ["produce", "meat", "dairy", "bakery", "frozen", "pantry", "beverages", "other"].indexOf(b),
      ),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- groceryList`
Expected: FAIL — `generateGroceryList` is not defined.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/groceryList.ts`:
```ts
import { scaleIngredient } from "./scaling";
import type {
  WeekPlan,
  PantryItem,
  GroceryItem,
  GroceryListSection,
  Aisle,
} from "./types";

const AISLE_ORDER: Aisle[] = [
  "produce",
  "meat",
  "dairy",
  "bakery",
  "frozen",
  "pantry",
  "beverages",
  "other",
];

function key(name: string, unit: string): string {
  return `${name.toLowerCase()}|${unit.toLowerCase()}`;
}

/**
 * Build the full grocery list for a week.
 * NOTHING is ever removed: every ingredient and beverage appears.
 * Long-lasting items, and anything matched in the pantry, are flagged
 * mayAlreadyHave = "check before buying".
 */
export function generateGroceryList(
  plan: WeekPlan,
  pantry: PantryItem[],
): GroceryListSection[] {
  const pantryNames = new Set(pantry.map((p) => p.name.toLowerCase()));
  const byKey = new Map<string, GroceryItem>();

  for (const planned of plan.meals) {
    for (const ing of planned.meal.ingredients) {
      const scaled = scaleIngredient(ing, planned.servings, planned.leftovers);
      const k = key(scaled.name, scaled.unit);
      const existing = byKey.get(k);
      if (existing) {
        existing.quantity += scaled.quantity;
      } else {
        byKey.set(k, {
          name: scaled.name,
          quantity: scaled.quantity,
          unit: scaled.unit,
          aisle: scaled.aisle,
          shelfLife: scaled.shelfLife,
          mayAlreadyHave:
            scaled.shelfLife === "long-lasting" ||
            pantryNames.has(scaled.name.toLowerCase()),
        });
      }
    }
  }

  for (const bev of plan.beverages) {
    const k = key(bev.name, "");
    if (!byKey.has(k)) {
      byKey.set(k, {
        name: bev.name,
        quantity: 1,
        unit: "",
        aisle: "beverages",
        shelfLife: "perishable",
        mayAlreadyHave: pantryNames.has(bev.name.toLowerCase()),
      });
    }
  }

  // Re-evaluate pantry flag for aggregated items (covers items added before
  // a duplicate raised the quantity; flag depends only on name/shelfLife).
  const sections: GroceryListSection[] = [];
  for (const aisle of AISLE_ORDER) {
    const items = [...byKey.values()]
      .filter((i) => i.aisle === aisle)
      .sort((a, b) => a.name.localeCompare(b.name));
    if (items.length > 0) sections.push({ aisle, items });
  }
  return sections;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- groceryList`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/groceryList.ts src/lib/groceryList.test.ts
git commit -m "feat: add grocery list generation with aisle grouping and flags"
```

---

## Task 4: localStorage persistence (TDD)

**Files:**
- Create: `src/lib/storage.ts`
- Test: `src/lib/storage.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/storage.test.ts`:
```ts
import { describe, it, expect, beforeEach } from "vitest";
import { loadState, saveState, STORAGE_KEY } from "./storage";
import type { PlannerState } from "./storage";

const sample: PlannerState = {
  library: [
    { id: "m1", name: "Pasta", type: "dinner", ingredients: [] },
  ],
  week: { meals: [], beverages: [] },
  pantry: [{ id: "p1", name: "Salt" }],
};

describe("storage", () => {
  beforeEach(() => localStorage.clear());

  it("returns null when nothing is stored", () => {
    expect(loadState()).toBeNull();
  });

  it("round-trips state through localStorage", () => {
    saveState(sample);
    expect(loadState()).toEqual(sample);
  });

  it("writes under the documented key", () => {
    saveState(sample);
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
  });

  it("returns null on corrupt JSON instead of throwing", () => {
    localStorage.setItem(STORAGE_KEY, "{not valid json");
    expect(loadState()).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- storage`
Expected: FAIL — module not found / exports undefined.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/storage.ts`:
```ts
import type { Meal, WeekPlan, PantryItem } from "./types";

export interface PlannerState {
  library: Meal[];
  week: WeekPlan;
  pantry: PantryItem[];
}

export const STORAGE_KEY = "grocery-planner:v1";

export function loadState(): PlannerState | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as PlannerState;
  } catch {
    return null;
  }
}

export function saveState(state: PlannerState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- storage`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/storage.ts src/lib/storage.test.ts
git commit -m "feat: add localStorage persistence with corrupt-data guard"
```

---

## Task 5: Seed meal library + staples

**Files:**
- Create: `src/data/seedMeals.ts`
- Create: `src/data/staples.ts`
- Test: `src/data/seedMeals.test.ts`

Provides the starter content. Nine fully-specified meals across types, structured so more can be appended by copying the pattern. Ingredient quantities are for 2 servings.

- [ ] **Step 1: Write the failing test**

Create `src/data/seedMeals.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { SEED_MEALS } from "./seedMeals";

describe("SEED_MEALS", () => {
  it("has at least one of each meal type", () => {
    const types = new Set(SEED_MEALS.map((m) => m.type));
    expect(types.has("breakfast")).toBe(true);
    expect(types.has("lunch")).toBe(true);
    expect(types.has("dinner")).toBe(true);
  });

  it("every meal has a unique id and at least one ingredient", () => {
    const ids = new Set<string>();
    for (const m of SEED_MEALS) {
      expect(m.ingredients.length).toBeGreaterThan(0);
      expect(ids.has(m.id)).toBe(false);
      ids.add(m.id);
    }
  });

  it("every ingredient is fully tagged", () => {
    for (const m of SEED_MEALS) {
      for (const ing of m.ingredients) {
        expect(ing.name.length).toBeGreaterThan(0);
        expect(["perishable", "long-lasting"]).toContain(ing.shelfLife);
        expect([
          "produce", "meat", "dairy", "bakery", "frozen", "pantry", "beverages", "other",
        ]).toContain(ing.aisle);
      }
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- seedMeals`
Expected: FAIL — `SEED_MEALS` not defined.

- [ ] **Step 3: Write the seed data**

Create `src/data/seedMeals.ts`:
```ts
import type { Meal } from "../lib/types";

/**
 * Built-in starter library. Quantities are for 2 servings.
 * To add a meal: copy any object below, give it a unique id, and tag each
 * ingredient with an aisle and shelfLife.
 */
export const SEED_MEALS: Meal[] = [
  {
    id: "seed-scrambled-eggs",
    name: "Scrambled Eggs & Toast",
    type: "breakfast",
    ingredients: [
      { name: "Eggs", quantity: 4, unit: "", aisle: "dairy", shelfLife: "perishable" },
      { name: "Butter", quantity: 1, unit: "tbsp", aisle: "dairy", shelfLife: "perishable" },
      { name: "Bread", quantity: 4, unit: "slice", aisle: "bakery", shelfLife: "perishable" },
      { name: "Salt", quantity: 1, unit: "pinch", aisle: "pantry", shelfLife: "long-lasting" },
    ],
  },
  {
    id: "seed-oatmeal",
    name: "Oatmeal with Banana",
    type: "breakfast",
    ingredients: [
      { name: "Rolled oats", quantity: 1, unit: "cup", aisle: "pantry", shelfLife: "long-lasting" },
      { name: "Banana", quantity: 2, unit: "", aisle: "produce", shelfLife: "perishable" },
      { name: "Milk", quantity: 1, unit: "cup", aisle: "dairy", shelfLife: "perishable" },
      { name: "Honey", quantity: 2, unit: "tbsp", aisle: "pantry", shelfLife: "long-lasting" },
    ],
  },
  {
    id: "seed-yogurt-parfait",
    name: "Greek Yogurt Parfait",
    type: "breakfast",
    ingredients: [
      { name: "Greek yogurt", quantity: 2, unit: "cup", aisle: "dairy", shelfLife: "perishable" },
      { name: "Granola", quantity: 1, unit: "cup", aisle: "pantry", shelfLife: "long-lasting" },
      { name: "Blueberries", quantity: 1, unit: "cup", aisle: "produce", shelfLife: "perishable" },
    ],
  },
  {
    id: "seed-turkey-sandwich",
    name: "Turkey Sandwich",
    type: "lunch",
    ingredients: [
      { name: "Bread", quantity: 4, unit: "slice", aisle: "bakery", shelfLife: "perishable" },
      { name: "Sliced turkey", quantity: 0.5, unit: "lb", aisle: "meat", shelfLife: "perishable" },
      { name: "Cheddar cheese", quantity: 4, unit: "slice", aisle: "dairy", shelfLife: "perishable" },
      { name: "Lettuce", quantity: 4, unit: "leaf", aisle: "produce", shelfLife: "perishable" },
      { name: "Mayonnaise", quantity: 2, unit: "tbsp", aisle: "pantry", shelfLife: "long-lasting" },
    ],
  },
  {
    id: "seed-caesar-salad",
    name: "Chicken Caesar Salad",
    type: "lunch",
    ingredients: [
      { name: "Romaine lettuce", quantity: 1, unit: "head", aisle: "produce", shelfLife: "perishable" },
      { name: "Chicken breast", quantity: 0.75, unit: "lb", aisle: "meat", shelfLife: "perishable" },
      { name: "Parmesan cheese", quantity: 0.5, unit: "cup", aisle: "dairy", shelfLife: "perishable" },
      { name: "Caesar dressing", quantity: 0.5, unit: "cup", aisle: "pantry", shelfLife: "long-lasting" },
      { name: "Croutons", quantity: 1, unit: "cup", aisle: "pantry", shelfLife: "long-lasting" },
    ],
  },
  {
    id: "seed-black-bean-bowl",
    name: "Black Bean Rice Bowl",
    type: "lunch",
    ingredients: [
      { name: "White rice", quantity: 1, unit: "cup", aisle: "pantry", shelfLife: "long-lasting" },
      { name: "Black beans", quantity: 1, unit: "can", aisle: "pantry", shelfLife: "long-lasting" },
      { name: "Bell pepper", quantity: 1, unit: "", aisle: "produce", shelfLife: "perishable" },
      { name: "Avocado", quantity: 1, unit: "", aisle: "produce", shelfLife: "perishable" },
      { name: "Cumin", quantity: 1, unit: "tsp", aisle: "pantry", shelfLife: "long-lasting" },
    ],
  },
  {
    id: "seed-spaghetti",
    name: "Spaghetti Marinara",
    type: "dinner",
    ingredients: [
      { name: "Spaghetti noodles", quantity: 8, unit: "oz", aisle: "pantry", shelfLife: "long-lasting" },
      { name: "Marinara sauce", quantity: 1, unit: "jar", aisle: "pantry", shelfLife: "long-lasting" },
      { name: "Ground beef", quantity: 0.5, unit: "lb", aisle: "meat", shelfLife: "perishable" },
      { name: "Garlic", quantity: 2, unit: "clove", aisle: "produce", shelfLife: "perishable" },
      { name: "Parmesan cheese", quantity: 0.25, unit: "cup", aisle: "dairy", shelfLife: "perishable" },
    ],
  },
  {
    id: "seed-tacos",
    name: "Chicken Tacos",
    type: "dinner",
    ingredients: [
      { name: "Chicken thighs", quantity: 1, unit: "lb", aisle: "meat", shelfLife: "perishable" },
      { name: "Tortillas", quantity: 8, unit: "", aisle: "bakery", shelfLife: "perishable" },
      { name: "Taco seasoning", quantity: 1, unit: "packet", aisle: "pantry", shelfLife: "long-lasting" },
      { name: "Tomato", quantity: 2, unit: "", aisle: "produce", shelfLife: "perishable" },
      { name: "Shredded cheese", quantity: 1, unit: "cup", aisle: "dairy", shelfLife: "perishable" },
      { name: "Sour cream", quantity: 0.5, unit: "cup", aisle: "dairy", shelfLife: "perishable" },
    ],
  },
  {
    id: "seed-salmon",
    name: "Baked Salmon & Veggies",
    type: "dinner",
    ingredients: [
      { name: "Salmon fillet", quantity: 0.75, unit: "lb", aisle: "meat", shelfLife: "perishable" },
      { name: "Broccoli", quantity: 1, unit: "head", aisle: "produce", shelfLife: "perishable" },
      { name: "Lemon", quantity: 1, unit: "", aisle: "produce", shelfLife: "perishable" },
      { name: "Olive oil", quantity: 2, unit: "tbsp", aisle: "pantry", shelfLife: "long-lasting" },
      { name: "Salt", quantity: 1, unit: "tsp", aisle: "pantry", shelfLife: "long-lasting" },
    ],
  },
];
```

- [ ] **Step 4: Write the staples data**

Create `src/data/staples.ts`:
```ts
import type { PantryItem } from "../lib/types";

/** Common staples assumed already owned; pre-loaded into a new pantry. */
export const STAPLE_PANTRY: PantryItem[] = [
  { id: "staple-salt", name: "Salt" },
  { id: "staple-pepper", name: "Pepper" },
  { id: "staple-olive-oil", name: "Olive oil" },
  { id: "staple-sugar", name: "Sugar" },
  { id: "staple-flour", name: "Flour" },
];
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- seedMeals`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/data/
git commit -m "feat: add seed meal library and staple pantry items"
```

---

## Task 6: Planner state hook (TDD)

**Files:**
- Create: `src/hooks/usePlannerState.ts`
- Test: `src/hooks/usePlannerState.test.tsx`

Owns all app state, seeds first-run state, and persists every change to localStorage.

- [ ] **Step 1: Write the failing test**

Create `src/hooks/usePlannerState.test.tsx`:
```tsx
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePlannerState } from "./usePlannerState";
import { STORAGE_KEY } from "../lib/storage";
import { SEED_MEALS } from "../data/seedMeals";

describe("usePlannerState", () => {
  beforeEach(() => localStorage.clear());

  it("seeds the library and staples on first run", () => {
    const { result } = renderHook(() => usePlannerState());
    expect(result.current.state.library.length).toBe(SEED_MEALS.length);
    expect(result.current.state.pantry.length).toBeGreaterThan(0);
    expect(result.current.state.week.meals).toEqual([]);
  });

  it("adds a planned meal from the library", () => {
    const { result } = renderHook(() => usePlannerState());
    act(() => result.current.addPlannedMeal(SEED_MEALS[0], 2, false));
    expect(result.current.state.week.meals.length).toBe(1);
    expect(result.current.state.week.meals[0].meal.name).toBe(SEED_MEALS[0].name);
  });

  it("persists changes to localStorage", () => {
    const { result } = renderHook(() => usePlannerState());
    act(() => result.current.addBeverage("Coffee"));
    expect(localStorage.getItem(STORAGE_KEY)).toContain("Coffee");
  });

  it("removes a planned meal by id", () => {
    const { result } = renderHook(() => usePlannerState());
    act(() => result.current.addPlannedMeal(SEED_MEALS[0], 2, false));
    const id = result.current.state.week.meals[0].id;
    act(() => result.current.removePlannedMeal(id));
    expect(result.current.state.week.meals.length).toBe(0);
  });

  it("updates servings and leftovers on a planned meal", () => {
    const { result } = renderHook(() => usePlannerState());
    act(() => result.current.addPlannedMeal(SEED_MEALS[0], 2, false));
    const id = result.current.state.week.meals[0].id;
    act(() => result.current.updatePlannedMeal(id, { servings: 4, leftovers: true }));
    const pm = result.current.state.week.meals[0];
    expect(pm.servings).toBe(4);
    expect(pm.leftovers).toBe(true);
  });

  it("adds and removes pantry items", () => {
    const { result } = renderHook(() => usePlannerState());
    act(() => result.current.addPantryItem("Rice"));
    const item = result.current.state.pantry.find((p) => p.name === "Rice")!;
    expect(item).toBeTruthy();
    act(() => result.current.removePantryItem(item.id));
    expect(result.current.state.pantry.find((p) => p.name === "Rice")).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- usePlannerState`
Expected: FAIL — hook not defined.

- [ ] **Step 3: Write minimal implementation**

Create `src/hooks/usePlannerState.ts`:
```ts
import { useEffect, useState } from "react";
import { loadState, saveState } from "../lib/storage";
import type { PlannerState } from "../lib/storage";
import { SEED_MEALS } from "../data/seedMeals";
import { STAPLE_PANTRY } from "../data/staples";
import { makeId } from "../lib/id";
import type { Meal, PlannedMeal } from "../lib/types";

function initialState(): PlannerState {
  return loadState() ?? {
    library: SEED_MEALS,
    week: { meals: [], beverages: [] },
    pantry: STAPLE_PANTRY,
  };
}

export function usePlannerState() {
  const [state, setState] = useState<PlannerState>(initialState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  function addPlannedMeal(meal: Meal, servings: number, leftovers: boolean) {
    setState((s) => ({
      ...s,
      week: {
        ...s.week,
        meals: [...s.week.meals, { id: makeId(), meal, servings, leftovers }],
      },
    }));
  }

  function removePlannedMeal(id: string) {
    setState((s) => ({
      ...s,
      week: { ...s.week, meals: s.week.meals.filter((m) => m.id !== id) },
    }));
  }

  function updatePlannedMeal(
    id: string,
    patch: Partial<Pick<PlannedMeal, "servings" | "leftovers">>,
  ) {
    setState((s) => ({
      ...s,
      week: {
        ...s.week,
        meals: s.week.meals.map((m) => (m.id === id ? { ...m, ...patch } : m)),
      },
    }));
  }

  function addBeverage(name: string) {
    setState((s) => ({
      ...s,
      week: {
        ...s.week,
        beverages: [...s.week.beverages, { id: makeId(), name }],
      },
    }));
  }

  function removeBeverage(id: string) {
    setState((s) => ({
      ...s,
      week: { ...s.week, beverages: s.week.beverages.filter((b) => b.id !== id) },
    }));
  }

  function addCustomMeal(meal: Omit<Meal, "id">) {
    setState((s) => ({
      ...s,
      library: [...s.library, { ...meal, id: makeId() }],
    }));
  }

  function addPantryItem(name: string) {
    setState((s) => ({
      ...s,
      pantry: [...s.pantry, { id: makeId(), name }],
    }));
  }

  function removePantryItem(id: string) {
    setState((s) => ({
      ...s,
      pantry: s.pantry.filter((p) => p.id !== id),
    }));
  }

  function clearWeek() {
    setState((s) => ({ ...s, week: { meals: [], beverages: [] } }));
  }

  return {
    state,
    addPlannedMeal,
    removePlannedMeal,
    updatePlannedMeal,
    addBeverage,
    removeBeverage,
    addCustomMeal,
    addPantryItem,
    removePantryItem,
    clearWeek,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- usePlannerState`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/usePlannerState.ts src/hooks/usePlannerState.test.tsx
git commit -m "feat: add planner state hook with seeding and persistence"
```

---

## Task 7: App shell + tab navigation

**Files:**
- Modify: `src/App.tsx`
- Test: `src/App.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/App.test.tsx`:
```tsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

describe("App", () => {
  beforeEach(() => localStorage.clear());

  it("shows the This Week screen by default", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /this week/i })).toBeInTheDocument();
  });

  it("navigates to the Meal Library tab", async () => {
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: /library/i }));
    expect(screen.getByRole("heading", { name: /meal library/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- App`
Expected: FAIL — headings/buttons not present.

- [ ] **Step 3: Write minimal implementation**

Overwrite `src/App.tsx`:
```tsx
import { useState } from "react";
import { usePlannerState } from "./hooks/usePlannerState";
import { ThisWeek } from "./components/ThisWeek";
import { GroceryList } from "./components/GroceryList";
import { MealLibrary } from "./components/MealLibrary";
import { Pantry } from "./components/Pantry";

type Tab = "week" | "grocery" | "library" | "pantry";

const TABS: { id: Tab; label: string }[] = [
  { id: "week", label: "This Week" },
  { id: "grocery", label: "Grocery List" },
  { id: "library", label: "Meal Library" },
  { id: "pantry", label: "Pantry" },
];

export default function App() {
  const planner = usePlannerState();
  const [tab, setTab] = useState<Tab>("week");

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <h1 className="text-xl font-bold">Weekly Grocery Planner</h1>
          <nav className="mt-3 flex gap-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 py-1.5 rounded text-sm font-medium ${
                  tab === t.id
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-6">
        {tab === "week" && <ThisWeek planner={planner} onShowGrocery={() => setTab("grocery")} />}
        {tab === "grocery" && <GroceryList planner={planner} />}
        {tab === "library" && <MealLibrary planner={planner} />}
        {tab === "pantry" && <Pantry planner={planner} />}
      </main>
    </div>
  );
}
```

NOTE: This imports four components built in Tasks 8–11. Create empty placeholder files now so the app compiles; each task replaces its placeholder with the real component. Create these four files:

`src/components/ThisWeek.tsx`:
```tsx
import type { usePlannerState } from "../hooks/usePlannerState";
type Props = { planner: ReturnType<typeof usePlannerState>; onShowGrocery: () => void };
export function ThisWeek(_props: Props) {
  return <h2 className="text-lg font-semibold">This Week</h2>;
}
```

`src/components/GroceryList.tsx`:
```tsx
import type { usePlannerState } from "../hooks/usePlannerState";
type Props = { planner: ReturnType<typeof usePlannerState> };
export function GroceryList(_props: Props) {
  return <h2 className="text-lg font-semibold">Grocery List</h2>;
}
```

`src/components/MealLibrary.tsx`:
```tsx
import type { usePlannerState } from "../hooks/usePlannerState";
type Props = { planner: ReturnType<typeof usePlannerState> };
export function MealLibrary(_props: Props) {
  return <h2 className="text-lg font-semibold">Meal Library</h2>;
}
```

`src/components/Pantry.tsx`:
```tsx
import type { usePlannerState } from "../hooks/usePlannerState";
type Props = { planner: ReturnType<typeof usePlannerState> };
export function Pantry(_props: Props) {
  return <h2 className="text-lg font-semibold">Pantry</h2>;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- App`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/App.test.tsx src/components/
git commit -m "feat: add app shell with tab navigation and component placeholders"
```

---

## Task 8: Meal Library screen

**Files:**
- Modify: `src/components/MealLibrary.tsx`
- Test: `src/components/MealLibrary.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/MealLibrary.test.tsx`:
```tsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderHook } from "@testing-library/react";
import { usePlannerState } from "../hooks/usePlannerState";
import { MealLibrary } from "./MealLibrary";

beforeEach(() => localStorage.clear());

it("lists seeded meals and filters by search", async () => {
  const { result } = renderHook(() => usePlannerState());
  render(<MealLibrary planner={result.current} />);
  expect(screen.getByText("Spaghetti Marinara")).toBeInTheDocument();
  await userEvent.type(screen.getByPlaceholderText(/search meals/i), "taco");
  expect(screen.queryByText("Spaghetti Marinara")).not.toBeInTheDocument();
  expect(screen.getByText("Chicken Tacos")).toBeInTheDocument();
});

it("creates a custom meal with one ingredient and adds it to the library", async () => {
  const { result, rerender } = renderHook(() => usePlannerState());
  const { rerender: rr } = render(<MealLibrary planner={result.current} />);
  await userEvent.click(screen.getByRole("button", { name: /add your own meal/i }));
  await userEvent.type(screen.getByLabelText(/meal name/i), "Grilled Cheese");
  await userEvent.type(screen.getByLabelText(/first ingredient/i), "Bread");
  await userEvent.click(screen.getByRole("button", { name: /save meal/i }));
  rerender();
  rr(<MealLibrary planner={result.current} />);
  expect(result.current.state.library.map((m) => m.name)).toContain("Grilled Cheese");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- MealLibrary`
Expected: FAIL — placeholder has no search box.

- [ ] **Step 3: Write minimal implementation**

Overwrite `src/components/MealLibrary.tsx`:
```tsx
import { useState } from "react";
import type { usePlannerState } from "../hooks/usePlannerState";
import type { MealType } from "../lib/types";

type Props = { planner: ReturnType<typeof usePlannerState> };

const TYPES: MealType[] = ["breakfast", "lunch", "dinner"];

export function MealLibrary({ planner }: Props) {
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<MealType>("dinner");
  const [ingredient, setIngredient] = useState("");

  const meals = planner.state.library.filter((m) =>
    m.name.toLowerCase().includes(query.toLowerCase()),
  );

  function saveMeal(e: React.FormEvent) {
    e.preventDefault();
    const mealName = name.trim();
    const ingName = ingredient.trim();
    if (!mealName || !ingName) return;
    planner.addCustomMeal({
      name: mealName,
      type,
      // v1 custom meals capture one ingredient with safe defaults; multi-row
      // ingredient entry is a future enhancement.
      ingredients: [
        { name: ingName, quantity: 1, unit: "", aisle: "other", shelfLife: "perishable" },
      ],
    });
    setName("");
    setIngredient("");
    setType("dinner");
    setShowForm(false);
  }

  return (
    <section>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold">Meal Library</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-3 py-1.5 rounded bg-emerald-600 text-white text-sm"
        >
          {showForm ? "Cancel" : "Add your own meal"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={saveMeal} className="bg-white border rounded p-3 mb-4 space-y-3">
          <div>
            <label htmlFor="meal-name" className="block text-sm font-medium mb-1">Meal name</label>
            <input
              id="meal-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="meal-type" className="block text-sm font-medium mb-1">Type</label>
            <select
              id="meal-type"
              value={type}
              onChange={(e) => setType(e.target.value as MealType)}
              className="border rounded px-2 py-1.5 capitalize"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="meal-ingredient" className="block text-sm font-medium mb-1">First ingredient</label>
            <input
              id="meal-ingredient"
              value={ingredient}
              onChange={(e) => setIngredient(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <button type="submit" className="px-3 py-2 rounded bg-gray-800 text-white text-sm">
            Save meal
          </button>
        </form>
      )}

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search meals…"
        className="w-full border rounded px-3 py-2 mb-4"
      />
      <ul className="space-y-3">
        {meals.map((m) => (
          <li key={m.id} className="bg-white border rounded p-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">{m.name}</span>
              <span className="text-xs uppercase text-gray-500">{m.type}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {m.ingredients.map((i) => i.name).join(", ")}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- MealLibrary`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/MealLibrary.tsx src/components/MealLibrary.test.tsx
git commit -m "feat: add meal library screen with search"
```

---

## Task 9: This Week screen (add meals, suggest, beverages)

**Files:**
- Modify: `src/components/ThisWeek.tsx`
- Test: `src/components/ThisWeek.test.tsx`

Implements: choose a meal by type with servings (default 2) + leftovers, OR "Suggest for me" (random pick from library of that type), add beverages, list the week, and a button to the grocery list.

- [ ] **Step 1: Write the failing test**

Create `src/components/ThisWeek.test.tsx`:
```tsx
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderHook, act } from "@testing-library/react";
import { usePlannerState } from "../hooks/usePlannerState";
import { ThisWeek } from "./ThisWeek";

beforeEach(() => localStorage.clear());

it("suggests a dinner and adds it to the week", async () => {
  const { result, rerender } = renderHook(() => usePlannerState());
  const onShow = vi.fn();
  const { rerender: rr } = render(<ThisWeek planner={result.current} onShowGrocery={onShow} />);
  await userEvent.click(screen.getByRole("button", { name: /suggest a dinner/i }));
  rerender();
  rr(<ThisWeek planner={result.current} onShowGrocery={onShow} />);
  expect(result.current.state.week.meals.length).toBe(1);
  expect(result.current.state.week.meals[0].meal.type).toBe("dinner");
});

it("lets the user add a specific meal they chose themselves", async () => {
  const { result, rerender } = renderHook(() => usePlannerState());
  const { rerender: rr } = render(<ThisWeek planner={result.current} onShowGrocery={() => {}} />);
  await userEvent.selectOptions(
    screen.getByLabelText(/add a specific meal/i),
    "seed-spaghetti",
  );
  await userEvent.click(screen.getByRole("button", { name: /add to week/i }));
  rerender();
  rr(<ThisWeek planner={result.current} onShowGrocery={() => {}} />);
  expect(result.current.state.week.meals.map((m) => m.meal.id)).toContain("seed-spaghetti");
});

it("adds a beverage", async () => {
  const { result, rerender } = renderHook(() => usePlannerState());
  const { rerender: rr } = render(<ThisWeek planner={result.current} onShowGrocery={() => {}} />);
  await userEvent.type(screen.getByPlaceholderText(/add a beverage/i), "Coffee");
  await userEvent.click(screen.getByRole("button", { name: /add beverage/i }));
  rerender();
  rr(<ThisWeek planner={result.current} onShowGrocery={() => {}} />);
  expect(result.current.state.week.beverages.map((b) => b.name)).toContain("Coffee");
});

it("edits servings and toggles leftovers on a planned meal", async () => {
  const { result, rerender } = renderHook(() => usePlannerState());
  act(() => result.current.addPlannedMeal(
    result.current.state.library.find((m) => m.id === "seed-spaghetti")!, 2, false,
  ));
  const { rerender: rr } = render(<ThisWeek planner={result.current} onShowGrocery={() => {}} />);
  const row = screen.getByText("Spaghetti Marinara").closest("li")!;
  const servings = row.querySelector("input[type=number]")! as HTMLInputElement;
  await userEvent.clear(servings);
  await userEvent.type(servings, "4");
  await userEvent.click(row.querySelector("input[type=checkbox]")! as HTMLInputElement);
  rerender();
  rr(<ThisWeek planner={result.current} onShowGrocery={() => {}} />);
  const pm = result.current.state.week.meals[0];
  expect(pm.servings).toBe(4);
  expect(pm.leftovers).toBe(true);
});
```

NOTE ON TEST STYLE: because `usePlannerState` returns fresh closures each render, the tests above re-render the hook and re-render the component with the latest `planner`. Follow this pattern exactly for week-mutating assertions.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- ThisWeek`
Expected: FAIL — placeholder has no suggest/beverage controls.

- [ ] **Step 3: Write minimal implementation**

Overwrite `src/components/ThisWeek.tsx`:
```tsx
import { useState } from "react";
import type { usePlannerState } from "../hooks/usePlannerState";
import type { MealType } from "../lib/types";

type Props = {
  planner: ReturnType<typeof usePlannerState>;
  onShowGrocery: () => void;
};

const TYPES: MealType[] = ["breakfast", "lunch", "dinner"];

export function ThisWeek({ planner, onShowGrocery }: Props) {
  const {
    state,
    addPlannedMeal,
    removePlannedMeal,
    updatePlannedMeal,
    addBeverage,
    removeBeverage,
    clearWeek,
  } = planner;
  const [bev, setBev] = useState("");
  const [pickId, setPickId] = useState("");

  function suggest(type: MealType) {
    const pool = state.library.filter((m) => m.type === type);
    if (pool.length === 0) return;
    // Index varies with current count so repeated clicks rotate choices.
    const pick = pool[state.week.meals.length % pool.length];
    addPlannedMeal(pick, 2, false);
  }

  function addSpecific() {
    const meal = state.library.find((m) => m.id === pickId);
    if (!meal) return;
    addPlannedMeal(meal, 2, false);
    setPickId("");
  }

  function submitBeverage(e: React.FormEvent) {
    e.preventDefault();
    const name = bev.trim();
    if (!name) return;
    addBeverage(name);
    setBev("");
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-3">This Week</h2>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => suggest(t)}
              className="px-3 py-1.5 rounded bg-emerald-600 text-white text-sm capitalize"
            >
              Suggest a {t}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label htmlFor="specific-meal" className="text-sm text-gray-600">
            …or add a specific meal:
          </label>
          <select
            id="specific-meal"
            aria-label="Add a specific meal"
            value={pickId}
            onChange={(e) => setPickId(e.target.value)}
            className="border rounded px-2 py-1.5 text-sm"
          >
            <option value="">Choose a meal…</option>
            {state.library.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.type})
              </option>
            ))}
          </select>
          <button
            onClick={addSpecific}
            disabled={!pickId}
            className="px-3 py-1.5 rounded bg-gray-800 text-white text-sm disabled:opacity-40"
          >
            Add to week
          </button>
        </div>
      </div>

      <ul className="space-y-2">
        {state.week.meals.map((pm) => (
          <li key={pm.id} className="bg-white border rounded p-3 flex flex-wrap justify-between items-center gap-3">
            <div>
              <span className="font-medium">{pm.meal.name}</span>
              <span className="ml-2 text-xs uppercase text-gray-500">{pm.meal.type}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <label className="flex items-center gap-1">
                Serves
                <input
                  type="number"
                  min={1}
                  value={pm.servings}
                  onChange={(e) =>
                    updatePlannedMeal(pm.id, { servings: Math.max(1, Number(e.target.value) || 1) })
                  }
                  className="w-14 border rounded px-2 py-1"
                  aria-label={`Servings for ${pm.meal.name}`}
                />
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={pm.leftovers}
                  onChange={(e) => updatePlannedMeal(pm.id, { leftovers: e.target.checked })}
                  aria-label={`Leftovers for ${pm.meal.name}`}
                />
                Leftovers
              </label>
              <button onClick={() => removePlannedMeal(pm.id)} className="text-red-600">
                Remove
              </button>
            </div>
          </li>
        ))}
        {state.week.meals.length === 0 && (
          <li className="text-sm text-gray-500">No meals yet — suggest one above.</li>
        )}
      </ul>

      <div>
        <h3 className="font-semibold mb-2">Beverages</h3>
        <form onSubmit={submitBeverage} className="flex gap-2">
          <input
            value={bev}
            onChange={(e) => setBev(e.target.value)}
            placeholder="Add a beverage…"
            className="flex-1 border rounded px-3 py-2"
          />
          <button type="submit" className="px-3 py-2 rounded bg-gray-800 text-white text-sm">
            Add beverage
          </button>
        </form>
        <ul className="mt-2 flex flex-wrap gap-2">
          {state.week.beverages.map((b) => (
            <li key={b.id} className="bg-white border rounded px-2 py-1 text-sm flex items-center gap-2">
              {b.name}
              <button onClick={() => removeBeverage(b.id)} className="text-red-600">×</button>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onShowGrocery}
          className="px-4 py-2 rounded bg-emerald-700 text-white font-medium"
        >
          Generate Grocery List
        </button>
        <button onClick={clearWeek} className="px-4 py-2 rounded bg-gray-100 text-gray-700">
          Clear Week
        </button>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- ThisWeek`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/ThisWeek.tsx src/components/ThisWeek.test.tsx
git commit -m "feat: add This Week screen with suggestions and beverages"
```

---

## Task 10: Grocery List screen (aisle groups, flags, already-have taps)

**Files:**
- Modify: `src/components/GroceryList.tsx`
- Test: `src/components/GroceryList.test.tsx`

Renders `generateGroceryList`, shows aisle sections, the 🟡 "check before buying" flag on `mayAlreadyHave`, and a local "already have" tap that strikes the item in place (visual only; nothing is removed).

- [ ] **Step 1: Write the failing test**

Create `src/components/GroceryList.test.tsx`:
```tsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderHook, act } from "@testing-library/react";
import { usePlannerState } from "../hooks/usePlannerState";
import { GroceryList } from "./GroceryList";
import { SEED_MEALS } from "../data/seedMeals";

beforeEach(() => localStorage.clear());

function spaghetti() {
  return SEED_MEALS.find((m) => m.id === "seed-spaghetti")!;
}

it("renders aisle sections with items from the week", () => {
  const { result } = renderHook(() => usePlannerState());
  act(() => result.current.addPlannedMeal(spaghetti(), 2, false));
  render(<GroceryList planner={result.current} />);
  expect(screen.getByText(/spaghetti noodles/i)).toBeInTheDocument();
  expect(screen.getByText(/produce/i)).toBeInTheDocument();
});

it("flags long-lasting items with a check-before-buying note", () => {
  const { result } = renderHook(() => usePlannerState());
  act(() => result.current.addPlannedMeal(spaghetti(), 2, false));
  render(<GroceryList planner={result.current} />);
  const row = screen.getByText(/spaghetti noodles/i).closest("li")!;
  expect(row.textContent).toMatch(/check before buying/i);
});

it("strikes an item in place when 'already have' is tapped, without removing it", async () => {
  const { result } = renderHook(() => usePlannerState());
  act(() => result.current.addPlannedMeal(spaghetti(), 2, false));
  render(<GroceryList planner={result.current} />);
  const row = screen.getByText(/spaghetti noodles/i).closest("li")!;
  const toggle = row.querySelector("input[type=checkbox]")! as HTMLInputElement;
  await userEvent.click(toggle);
  expect(screen.getByText(/spaghetti noodles/i)).toBeInTheDocument(); // still present
  expect(row.className).toMatch(/line-through/);
});

it("shows an empty message when no meals are planned", () => {
  const { result } = renderHook(() => usePlannerState());
  render(<GroceryList planner={result.current} />);
  expect(screen.getByText(/no meals planned/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- GroceryList`
Expected: FAIL — placeholder renders only a heading.

- [ ] **Step 3: Write minimal implementation**

Overwrite `src/components/GroceryList.tsx`:
```tsx
import { useState } from "react";
import type { usePlannerState } from "../hooks/usePlannerState";
import { generateGroceryList } from "../lib/groceryList";

type Props = { planner: ReturnType<typeof usePlannerState> };

function fmtQty(qty: number, unit: string): string {
  const rounded = Math.round(qty * 100) / 100;
  return unit ? `${rounded} ${unit}` : `${rounded}`;
}

export function GroceryList({ planner }: Props) {
  const sections = generateGroceryList(planner.state.week, planner.state.pantry);
  const [have, setHave] = useState<Record<string, boolean>>({});

  function toggle(key: string) {
    setHave((h) => ({ ...h, [key]: !h[key] }));
  }

  if (planner.state.week.meals.length === 0 && planner.state.week.beverages.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-3">Grocery List</h2>
        <p className="text-sm text-gray-500">No meals planned yet. Add some on the This Week tab.</p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">Grocery List</h2>
      <div className="space-y-5">
        {sections.map((section) => (
          <div key={section.aisle}>
            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2 capitalize">
              {section.aisle}
            </h3>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const key = `${section.aisle}:${item.name}:${item.unit}`;
                const checked = !!have[key];
                return (
                  <li
                    key={key}
                    className={`bg-white border rounded px-3 py-2 flex items-start gap-3 ${
                      checked ? "line-through text-gray-400" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(key)}
                      className="mt-1"
                      aria-label={`Already have ${item.name}`}
                    />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-sm text-gray-500">{fmtQty(item.quantity, item.unit)}</span>
                      </div>
                      {item.mayAlreadyHave && (
                        <p className="text-xs text-amber-600 mt-0.5">
                          🟡 You may already have this — check before buying.
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- GroceryList`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/GroceryList.tsx src/components/GroceryList.test.tsx
git commit -m "feat: add grocery list screen with aisle groups, flags, already-have taps"
```

---

## Task 11: Pantry screen

**Files:**
- Modify: `src/components/Pantry.tsx`
- Test: `src/components/Pantry.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/Pantry.test.tsx`:
```tsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderHook } from "@testing-library/react";
import { usePlannerState } from "../hooks/usePlannerState";
import { Pantry } from "./Pantry";

beforeEach(() => localStorage.clear());

it("shows pre-loaded staples and adds a new item", async () => {
  const { result, rerender } = renderHook(() => usePlannerState());
  const { rerender: rr } = render(<Pantry planner={result.current} />);
  expect(screen.getByText("Salt")).toBeInTheDocument();
  await userEvent.type(screen.getByPlaceholderText(/add an item/i), "Rice");
  await userEvent.click(screen.getByRole("button", { name: /add to pantry/i }));
  rerender();
  rr(<Pantry planner={result.current} />);
  expect(result.current.state.pantry.map((p) => p.name)).toContain("Rice");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- Pantry`
Expected: FAIL — placeholder has no add control.

- [ ] **Step 3: Write minimal implementation**

Overwrite `src/components/Pantry.tsx`:
```tsx
import { useState } from "react";
import type { usePlannerState } from "../hooks/usePlannerState";

type Props = { planner: ReturnType<typeof usePlannerState> };

export function Pantry({ planner }: Props) {
  const { state, addPantryItem, removePantryItem } = planner;
  const [name, setName] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    addPantryItem(n);
    setName("");
  }

  return (
    <section>
      <h2 className="text-lg font-semibold mb-2">Pantry</h2>
      <p className="text-sm text-gray-600 mb-4">
        Things you already own. Long-lasting items on your grocery list get a
        "check before buying" flag automatically; add anything else here.
      </p>
      <form onSubmit={submit} className="flex gap-2 mb-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add an item…"
          className="flex-1 border rounded px-3 py-2"
        />
        <button type="submit" className="px-3 py-2 rounded bg-gray-800 text-white text-sm">
          Add to pantry
        </button>
      </form>
      <ul className="flex flex-wrap gap-2">
        {state.pantry.map((p) => (
          <li key={p.id} className="bg-white border rounded px-2 py-1 text-sm flex items-center gap-2">
            {p.name}
            <button onClick={() => removePantryItem(p.id)} className="text-red-600">×</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- Pantry`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/Pantry.tsx src/components/Pantry.test.tsx
git commit -m "feat: add pantry screen"
```

---

## Task 12: Full verification + Netlify deploy config

**Files:**
- Create: `netlify.toml`
- Create: `README.md`

- [ ] **Step 1: Run the full test suite**

Run:
```bash
npm test
```
Expected: ALL tests pass across every `*.test.ts(x)` file.

- [ ] **Step 2: Production build**

Run:
```bash
npm run build
```
Expected: succeeds, emits `dist/`.

- [ ] **Step 3: Add Netlify config**

Create `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

- [ ] **Step 4: Add README with run + deploy steps**

Create `README.md`:
```markdown
# Weekly Grocery Planner

Plan a week of meals (typed in or suggested from a built-in library) and turn
the plan into an aisle-grouped grocery list. Data is saved in your browser —
no account needed. Share the deployed link; each person gets their own space.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # run unit tests
```

## Deploy (Netlify)

1. Push this repo to GitHub.
2. In Netlify: "Add new site" → "Import from GitHub" → pick this repo.
3. Build settings are read from `netlify.toml` (build `npm run build`, publish `dist`).
4. Deploy. Share the resulting URL.
```

- [ ] **Step 5: Manual smoke test**

Run:
```bash
npm run dev
```
In the browser at http://localhost:5173: suggest a dinner, add a beverage, open Grocery List (confirm aisle groups + a 🟡 flag on a long-lasting item), tap "already have" (item strikes through, stays visible), add a pantry item. Reload the page — confirm the week persists.

- [ ] **Step 6: Commit**

```bash
git add netlify.toml README.md
git commit -m "chore: add Netlify config and README"
```

---

## Self-Review Notes (for the implementer)

- **Spec coverage:** both/on-demand entry → Task 9 (Suggest buttons + "add a specific meal" picker) and Task 8 (create your own meal); curated library → Task 5; shareable static app → Task 12; nothing-hidden grocery philosophy with long-lasting flag → Task 3 + Task 10; perishables always plain → Task 3; "already have" tap strikes in place → Task 10; 4 screens → Tasks 8–11; pantry staples pre-loaded → Task 5/6; localStorage persistence → Task 4/6; Vite+React+Tailwind+Netlify → Tasks 0 & 12.
- **Known v1 simplifications (flagged, not silently dropped):**
  - "Suggest for me" rotates through the library by index rather than using randomness (`Math.random()`/`Date.now()` avoided for deterministic tests). Good enough for v1; swap to true random later.
  - Custom meals (Task 8) capture a single ingredient with default aisle "other" / shelfLife "perishable". Multi-ingredient entry with per-ingredient aisle + shelf-life tagging is a clean future enhancement; the seeded library already has fully-tagged multi-ingredient meals.
- **Servings + leftovers** are captured per planned meal via inline controls on the This Week list (Task 9), editable any time; they default to 2 / no-leftovers at add time and flow through `scaleIngredient` into the grocery quantities.
