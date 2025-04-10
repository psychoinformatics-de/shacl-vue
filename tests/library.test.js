import { describe, it, expect } from "vitest";

// Test importing from the built "shacl-vue" package
describe("shacl-vue package exports", () => {
  it("should import ShaclVue from 'shacl-vue'", async () => {
    // Import the built package from "dist"
    const { ShaclVue } = await import("../dist/lib/shacl-vue.es.js");

    // Ensure they exist
    expect(ShaclVue).toBeDefined();
  });
});
