import { describe, expect, it } from "vitest";

import {
  appAcceptance,
  validateProductAcceptanceCoverage,
} from "./app-acceptance";
import { appPerformance } from "./app-performance";
import { appSchema } from "./app-schema";
import { dotTargets } from "./foci/dot-values";

describe("appSchema", () => {
  it("publishes the Foci Dots product contract", () => {
    expect(appSchema.canvas.enabled).toBe(true);
    expect(appSchema.canvas.sizing).toEqual({
      defaultMode: "infinite",
      mode: "editable-output",
    });
    expect(appSchema.canvas.upload).toBe(true);
    expect(appSchema.canvas.renderScale.enabled).toBe(true);
    expect(appSchema.panels.controls?.sections[0]?.title).toBe("Setup");
    expect(appSchema.panels.timeline).toMatchObject({
      defaultDurationSeconds: 6,
      enabled: true,
      mode: "playback",
    });
    expect(appSchema.panels.layers).toBeUndefined();
  });

  it("declares the product control sections", () => {
    const sectionTitles =
      appSchema.panels.controls?.sections.map((section) => section.title) ?? [];
    expect(sectionTitles).toContain("Dot Grid");
    expect(sectionTitles).toContain("Pattern");
    expect(sectionTitles).toContain("Motion");
    expect(sectionTitles).toContain("Image Export");

    const allControls =
      appSchema.panels.controls?.sections.flatMap((section) =>
        Object.values(section.controls),
      ) ?? [];
    const targets = allControls.map((control) => control.target);
    for (const target of Object.values(dotTargets)) {
      expect(targets).toContain(target);
    }
  });

  it("declares the workload envelope for the dot lattice and export size", () => {
    const dimensionIds = appPerformance.workloadEnvelope.dimensions.map(
      (dimension) => dimension.id,
    );
    expect(dimensionIds).toEqual(
      expect.arrayContaining(["grid-columns", "export-width"]),
    );
    expect(appPerformance.scenarios.length).toBeGreaterThan(0);
    expect(appPerformance.usesCustomRenderer).toBe(true);
  });

  it("declares production reload coverage for the product schema", () => {
    expect(appSchema.persistence.storage).toBe("localStorage");
    if (appSchema.persistence.storage !== "localStorage") {
      throw new Error("The product must persist user settings in localStorage.");
    }
    expect(appSchema.persistence.include).toContain("canvas");
    expect(appSchema.persistence.include).toContain("timeline");
    expect(appSchema.persistence.include).toContain("media");
    expect(
      appAcceptance.find((entry) => entry.id === "persistence.reload"),
    ).toMatchObject({
      automated: true,
      browser: true,
      evidence: "persistence-state",
      kind: "runtime",
      persistenceCoverage: "reload",
      persistenceSlices: appSchema.persistence.include,
      target: "canvas.size.width",
    });
    expect(validateProductAcceptanceCoverage()).toEqual([]);
  });
});
