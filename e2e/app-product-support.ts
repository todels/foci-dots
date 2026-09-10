import { expect, type Locator, type Page } from "@playwright/test";

import {
  appControlSectionInventory,
  getToolcraftApplicabilityRequirementId,
  getToolcraftControlApplicabilityCases,
  type ToolcraftControlApplicabilityCase,
} from "../src/app/app-acceptance";
import { appSchema } from "../src/app/app-schema";
import type {
  ToolcraftBrowserAction,
  ToolcraftBrowserObservation,
  ToolcraftBrowserProofSession,
} from "./browser-proof-session";
import {
  createToolcraftBrowserProofSession,
  getToolcraftBrowserProofPage,
} from "./browser-proof-session";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import { dragToolcraftSliderByTarget } from "./performance-slider-helpers";
import { expectToolcraftControlApplicabilityState } from "./browser-control-applicability-evidence";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";

export const productCanvasSelector =
  '[data-toolcraft-product-output="foci-dots"]';

type SchemaControl = {
  label?: boolean | string;
  options?: readonly { label: string; value: string }[];
  target: string;
  type: string;
  applicability?:
    | { mode: "always" }
    | {
        all: readonly {
          equals?: unknown;
          notEquals?: unknown;
          oneOf?: readonly unknown[];
          target: string;
        }[];
        mode: "conditional";
      };
};

const schemaControlsByTarget = new Map<string, SchemaControl>(
  (appSchema.panels.controls?.sections ?? []).flatMap((section) =>
    Object.values(section.controls).map(
      (control) => [control.target, control as SchemaControl] as const,
    ),
  ),
);

export function getProductApplicabilityCases(
  target: string,
): ToolcraftControlApplicabilityCase[] {
  return getToolcraftControlApplicabilityCases({
    schema: appSchema,
    sectionInventory: appControlSectionInventory,
    target,
  });
}

export { getToolcraftApplicabilityRequirementId };

function requireSchemaControl(target: string): SchemaControl {
  const control = schemaControlsByTarget.get(target);
  if (!control) {
    throw new Error(`Unknown product schema target "${target}".`);
  }
  return control;
}

function getOptionLabel(control: SchemaControl, value: unknown): string {
  const option = control.options?.find(
    (candidate) => candidate.value === value,
  );
  if (!option) {
    throw new Error(
      `Target "${control.target}" has no option value ${JSON.stringify(value)}.`,
    );
  }
  return option.label;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

async function selectOptionThroughPopup(
  page: Page,
  control: Locator,
  optionLabel: string,
): Promise<void> {
  const trigger = control.getByRole("combobox");
  // The popup renders outside the accessibility tree Playwright exposes, so
  // options are addressed through their rendered slot and exact visible text.
  const option = page
    .locator('[role="option"]')
    .filter({ hasText: new RegExp(`^${escapeRegExp(optionLabel)}$`) });
  await control.evaluate((element) =>
    element.scrollIntoView({ behavior: "instant", block: "center" }),
  );
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await trigger.click();
    try {
      await option.first().waitFor({ state: "visible", timeout: 2_000 });
      await option.first().click();
      await expect(trigger).toContainText(optionLabel);
      return;
    } catch {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(400);
    }
  }
  throw new Error(`Select option "${optionLabel}" never became clickable.`);
}

async function setControlValueOnPage(
  page: Page,
  control: Locator,
  schemaControl: SchemaControl,
  value: unknown,
): Promise<void> {
  await control.evaluate((element) =>
    element.scrollIntoView({ behavior: "instant", block: "center" }),
  );
  switch (schemaControl.type) {
    case "switch": {
      const element = control.getByRole("switch");
      if ((await element.getAttribute("aria-checked")) !== String(value)) {
        await element.click();
      }
      await expect(element).toHaveAttribute("aria-checked", String(value));
      return;
    }
    case "segmented": {
      await control
        .getByRole("button", {
          exact: true,
          name: getOptionLabel(schemaControl, value),
        })
        .click();
      return;
    }
    case "select": {
      const trigger = control.getByRole("combobox");
      const label = getOptionLabel(schemaControl, value);
      if ((await trigger.textContent())?.trim() === label) {
        return;
      }
      await selectOptionThroughPopup(page, control, label);
      await expect(trigger).toContainText(label);
      return;
    }
    case "text": {
      const input = control.locator("input");
      await input.fill(String(value));
      await input.press("Enter");
      return;
    }
    case "color": {
      const input = control.locator("input");
      await input.fill(String(value).replace(/^#/, ""));
      await input.press("Enter");
      return;
    }
    default:
      throw new Error(
        `setControlValue does not support control type "${schemaControl.type}".`,
      );
  }
}

/** Target-scoped action that sets a schema control to an exact value. */
export function setControlValueAction(
  session: ToolcraftBrowserProofSession,
  target: string,
  value: unknown,
): ToolcraftBrowserAction<"interaction"> {
  const schemaControl = requireSchemaControl(target);
  return session.controlAction(target, async (control, page) => {
    await setControlValueOnPage(page, control, schemaControl, value);
  });
}

/**
 * Puts the app into the state where `target`'s conditional applicability is
 * satisfied, leaving `excludeSelectorTarget` for the case selector action.
 */
export async function applyDependentBaseline(
  session: ToolcraftBrowserProofSession,
  target: string,
  excludeSelectorTarget?: string,
): Promise<void> {
  const control = requireSchemaControl(target);
  if (control.applicability?.mode !== "conditional") {
    return;
  }
  const page = await getToolcraftBrowserProofPage(session);
  for (const predicate of control.applicability.all) {
    if (predicate.target === excludeSelectorTarget) {
      continue;
    }
    const selector = requireSchemaControl(predicate.target);
    let value: unknown;
    if ("equals" in predicate && predicate.equals !== undefined) {
      value = predicate.equals;
    } else if (predicate.oneOf && predicate.oneOf.length > 0) {
      value = predicate.oneOf[0];
    } else if ("notEquals" in predicate && predicate.notEquals !== undefined) {
      value = selector.options?.find(
        (option) => option.value !== predicate.notEquals,
      )?.value;
    }
    if (value === undefined) {
      throw new Error(
        `Cannot derive a baseline value for predicate on "${predicate.target}".`,
      );
    }
    const field = await getToolcraftControlFieldByTarget(page, predicate.target);
    await setControlValueOnPage(page, field, selector, value);
  }
}

/**
 * Action that visibly changes the product output through `target`'s control.
 * Reads the current control state so repeated invocations alternate values.
 */
export function changeControlOutcomeAction(
  session: ToolcraftBrowserProofSession,
  target: string,
): ToolcraftBrowserAction<"interaction"> {
  const schemaControl = requireSchemaControl(target);
  return session.controlAction(target, async (control, page) => {
    await control.evaluate((element) =>
      element.scrollIntoView({ behavior: "instant", block: "center" }),
    );
    switch (schemaControl.type) {
      case "slider": {
        const thumb = control.getByRole("slider").first();
        const domain = await thumb.evaluate((element) => {
          const input = element as HTMLInputElement;
          const parse = (value: string | null, fallback: number): number => {
            const parsed = Number(value);
            return Number.isFinite(parsed) && value !== null && value !== ""
              ? parsed
              : fallback;
          };
          return {
            max: parse(
              element.getAttribute("aria-valuemax") ?? input.max,
              100,
            ),
            min: parse(element.getAttribute("aria-valuemin") ?? input.min, 0),
            now: parse(
              element.getAttribute("aria-valuenow") ?? input.value,
              0,
            ),
          };
        });
        const now = domain.now;
        const ratio = now < (domain.min + domain.max) / 2 ? 0.7 : 0.3;
        await control.evaluate((element) =>
          element.scrollIntoView({ behavior: "instant", block: "center" }),
        );
        try {
          await dragToolcraftSliderByTarget(page, target, ratio);
        } catch {
          // A transient overlay (toast, tooltip) can swallow one pointer
          // gesture; give it time to clear and repeat the same real drag.
          await page.waitForTimeout(1200);
          await dragToolcraftSliderByTarget(page, target, ratio);
        }
        await expect(thumb).not.toHaveAttribute("aria-valuenow", String(now));
        return;
      }
      case "rangeSlider": {
        const thumb = control.getByRole("slider").first();
        const now = Number(await thumb.getAttribute("aria-valuenow"));
        const key = now < 50 ? "ArrowRight" : "ArrowLeft";
        await control.evaluate((element) =>
          element.scrollIntoView({ behavior: "instant", block: "center" }),
        );
        await thumb.evaluate((element) => (element as HTMLElement).focus());
        for (let press = 0; press < 25; press += 1) {
          await page.keyboard.press(key);
        }
        return;
      }
      case "switch": {
        await control.getByRole("switch").click();
        return;
      }
      case "segmented": {
        const pressed = control.locator('[aria-pressed="true"]');
        const pressedLabel = await pressed.getAttribute("aria-label");
        const next = (schemaControl.options ?? []).find(
          (option) => option.label !== pressedLabel,
        );
        if (!next) throw new Error(`No alternate option for "${target}".`);
        await control
          .getByRole("button", { exact: true, name: next.label })
          .click();
        return;
      }
      case "select": {
        const trigger = control.getByRole("combobox");
        const current = (await trigger.textContent())?.trim();
        const next = (schemaControl.options ?? []).find(
          (option) => option.label !== current,
        );
        if (!next) throw new Error(`No alternate option for "${target}".`);
        await selectOptionThroughPopup(page, control, next.label);
        return;
      }
      case "color": {
        const input = control.locator("input");
        const current = ((await input.inputValue()) ?? "").toUpperCase();
        const nextColor = current.includes("22DD88") ? "DD2288" : "22DD88";
        await input.fill(nextColor);
        await input.press("Enter");
        return;
      }
      case "text": {
        const input = control.locator("input");
        const current = await input.inputValue();
        await input.fill(current === "DOT" ? "FOCI" : "DOT");
        return;
      }
      default:
        throw new Error(
          `changeControlOutcomeAction does not support "${schemaControl.type}".`,
        );
    }
  });
}

/**
 * Runs the complete derived applicability matrix for one control acceptance
 * row: for every case it selects the branch, proves presence or absence, and
 * for visible cases re-proves the control's product outcome.
 */
export async function proveControlApplicabilityMatrix(
  session: ToolcraftBrowserProofSession,
  options: Readonly<{
    prepareVisibleCase?: (
      applicabilityCase: ToolcraftControlApplicabilityCase,
    ) => Promise<void>;
    proveVisibleOutcome?: (
      applicabilityCase: ToolcraftControlApplicabilityCase,
      requirementId: string,
    ) => Promise<void>;
    requirementId: string;
    target: string;
  }>,
): Promise<ToolcraftControlApplicabilityCase[]> {
  const cases = getProductApplicabilityCases(options.target);

  for (const applicabilityCase of cases) {
    await applyDependentBaseline(
      session,
      options.target,
      applicabilityCase.selectorTarget,
    );
    await expectToolcraftControlApplicabilityState(
      session,
      setControlValueAction(
        session,
        applicabilityCase.selectorTarget,
        applicabilityCase.selectorValue,
      ),
      applicabilityCase,
      { baseRequirementId: options.requirementId },
    );

    if (applicabilityCase.expectation !== "visible") {
      continue;
    }
    await options.prepareVisibleCase?.(applicabilityCase);
    const caseRequirementId = getToolcraftApplicabilityRequirementId(
      options.requirementId,
      applicabilityCase,
    );
    if (options.proveVisibleOutcome) {
      await options.proveVisibleOutcome(applicabilityCase, caseRequirementId);
    } else {
      await expectToolcraftProductObservableToChange(
        session,
        changeControlOutcomeAction(session, options.target),
        { requirementId: caseRequirementId, selector: productCanvasSelector },
      );
    }
  }

  return cases;
}

/**
 * Opens the app, creates the proof session, pauses default playback, and
 * normalizes the workspace to finite mode (the product defaults to the
 * infinite workspace) so frame-scoped proofs keep a stable artboard.
 */
export async function startProductSession(
  page: Page,
): Promise<ToolcraftBrowserProofSession> {
  await page.goto("/");
  const session = await createToolcraftBrowserProofSession(page);
  await pausePlayback(page);
  const infinityField = await getToolcraftControlFieldByTarget(
    page,
    "canvas.infinity",
  );
  const infinitySwitch = infinityField.getByRole("switch");
  if ((await infinitySwitch.getAttribute("aria-checked")) === "true") {
    await infinitySwitch.click();
    await expect(infinitySwitch).toHaveAttribute("aria-checked", "false");
  }
  return session;
}

/** Case-id suffix used to compose compound-part requirement ids. */
export function applicabilityCaseSuffix(
  applicabilityCase: ToolcraftControlApplicabilityCase,
): string {
  return getToolcraftApplicabilityRequirementId("", applicabilityCase).slice(1);
}

/** Pauses default playback so raster baselines stay stable during proofs. */
export async function pausePlayback(page: Page): Promise<void> {
  const pause = page.getByRole("button", { name: "Pause playback" });
  if (await pause.isVisible()) {
    await pause.click();
  }
}
