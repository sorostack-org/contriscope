import { describe, expect, it } from "vitest";
import { deepMerge } from "../src/config";

describe("deepMerge", () => {
  it("merges nested objects without clobbering siblings (3+ levels)", () => {
    const merged = deepMerge({ a: { b: { c: 1, d: 2 }, e: 3 }, f: 4 }, { a: { b: { c: 9 } } });
    expect(merged).toEqual({ a: { b: { c: 9, d: 2 }, e: 3 }, f: 4 });
  });

  it("replaces arrays wholesale instead of merging", () => {
    const merged = deepMerge(
      { tags: ["a", "b"], nested: { list: [1, 2] } },
      { tags: ["z"], nested: { list: [3] } },
    );
    expect(merged.tags).toEqual(["z"]);
    expect(merged.nested.list).toEqual([3]);
  });

  it("returns the base value when an override value is undefined", () => {
    const merged = deepMerge(
      { a: 1, nested: { x: 1 } },
      { a: undefined, nested: { x: undefined } },
    );
    expect(merged.a).toBe(1);
    expect(merged.nested.x).toBe(1);
  });

  it("replaces primitives with the override value", () => {
    const merged = deepMerge({ a: "text", b: true, c: 5 }, { a: "new", b: false, c: 0 });
    expect(merged).toEqual({ a: "new", b: false, c: 0 });
  });

  it("spreads override keys that are absent in base", () => {
    const merged = deepMerge({ a: 1 }, { extra: { x: 1 }, plain: "value" } as never);
    expect(merged).toEqual({ a: 1, extra: { x: 1 }, plain: "value" });
  });

  it("does not mutate the base object", () => {
    const base = { a: 1, nested: { x: 1 } };
    const merged = deepMerge(base, { nested: { x: 2 } });
    expect(base.nested.x).toBe(1);
    expect(merged.nested.x).toBe(2);
  });

  it("returns base when overrides are empty", () => {
    const base = { a: 1 };
    expect(deepMerge(base, {} as never)).toEqual({ a: 1 });
  });

  it("handles null values in either argument", () => {
    expect(deepMerge({ a: null }, { a: 1 } as never)).toEqual({ a: 1 });
    expect(deepMerge({ a: 1 }, { a: null } as never)).toEqual({ a: null });
  });
});
