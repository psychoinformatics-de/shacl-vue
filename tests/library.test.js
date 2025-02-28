import { describe, it, expect } from "vitest";

// Test importing from the built "shacl-vue" package
describe("shacl-vue package exports", () => {
  it("should import ShaclVue from 'shacl-vue'", async () => {
    // Import the built package from "dist"
    const { ShaclVue } = await import("../dist/lib/shacl-vue.es.js");

    // Ensure they exist
    expect(ShaclVue).toBeDefined();
  });

  it("should import useShapeData from 'shapedata'", async () => {
    // Import the built composable from "dist"
    const { useShapeData } = await import("../dist/lib/shapedata.es.js");

    // Ensure it exists
    expect(useShapeData).toBeDefined();
    expect(typeof useShapeData).toBe("function");
  });
});
