import { test, expect } from "@playwright/test";
import { buildSolutionXml, chooseFreePlay, chooseGuided, clearStorageBeforeEach, dismissTutorial, loadWorkspaceXml } from "./helpers.js";

clearStorageBeforeEach(test);

test("guided programs restore across a page reload", async ({ page }) => {
  await page.goto("/");
  await chooseGuided(page);
  await dismissTutorial(page);
  await loadWorkspaceXml(page, buildSolutionXml(`<block type="battlegorithms_move_forward"></block>`));

  await page.reload();
  await chooseGuided(page);
  await dismissTutorial(page);

  await expect(page.locator("#blockly-region")).toContainText("Move Forward");
});

test("free-play player program restores across a page reload", async ({ page }) => {
  await page.goto("/");
  await chooseFreePlay(page);
  await loadWorkspaceXml(page, buildSolutionXml(`<block type="battlegorithms_move_forward"></block>`));

  await page.reload();
  await chooseFreePlay(page);

  await expect(page.locator("#blockly-region")).toContainText("Move Forward");
});

test("PvP team programs restore separately across a page reload", async ({ page }) => {
  await page.goto("/");
  await chooseFreePlay(page);
  await page.locator('select[data-action="free-play-mode"]').selectOption("PVP");

  await loadWorkspaceXml(page, buildSolutionXml(`<block type="battlegorithms_move_forward"></block>`));
  await page.getByRole("button", { name: "Team 2 Program" }).click();
  await loadWorkspaceXml(page, buildSolutionXml(`<block type="battlegorithms_stay_still"></block>`));

  await page.reload();
  await chooseFreePlay(page);
  await page.locator('select[data-action="free-play-mode"]').selectOption("PVP");

  await expect(page.locator("#blockly-region")).toContainText("Move Forward");
  await page.getByRole("button", { name: "Team 2 Program" }).click();
  await expect(page.locator("#blockly-region")).toContainText("Stay Still");
});

test("sound preference persists across a page reload", async ({ page }) => {
  await page.goto("/");
  await chooseFreePlay(page);

  await page.getByRole("button", { name: "Sound: On" }).click();
  await expect(page.getByRole("button", { name: "Sound: Off" })).toBeVisible();

  await page.reload();
  await chooseFreePlay(page);
  await expect(page.getByRole("button", { name: "Sound: Off" })).toBeVisible();
});

test("malformed XML import shows an error and keeps the current program intact", async ({ page }) => {
  await page.goto("/");
  await chooseFreePlay(page);
  await loadWorkspaceXml(page, buildSolutionXml(`<block type="battlegorithms_move_forward"></block>`));

  await page.locator("#importWorkspaceInput").setInputFiles({
    name: "broken.xml",
    mimeType: "text/xml",
    buffer: Buffer.from("not xml at all")
  });

  await expect(page.locator("#workspace-import-status")).toContainText("Import failed");
  await expect(page.locator("#blockly-region")).toContainText("Move Forward");
});
