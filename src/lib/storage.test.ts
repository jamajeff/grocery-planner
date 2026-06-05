import { describe, it, expect, beforeEach } from "vitest";
import { loadState, saveState, STORAGE_KEY } from "./storage";
import type { PlannerState } from "./storage";

const sample: PlannerState = {
  library: [
    { id: "m1", name: "Pasta", type: "dinner", ingredients: [] },
  ],
  week: { meals: [], beverages: [] },
  pantry: [{ id: "p1", name: "Salt" }],
  archive: [],
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

  it("defaults archive to [] when missing from stored data", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ library: [], week: { meals: [], beverages: [] }, pantry: [] }),
    );
    expect(loadState()?.archive).toEqual([]);
  });
});
