import { expect } from "@playwright/test";

export function clearStorageBeforeEach(test) {
  test.beforeEach(async () => {});
}

export async function waitForHeavyReady(page) {
  await page.waitForFunction(
    () => window.__BBA_TEST_HOOKS__?.isEditorReady?.() && window.__BBA_TEST_HOOKS__?.isBoardReady?.(),
    null,
    { timeout: 20000 }
  );
}

export async function chooseGuided(page) {
  await page.waitForLoadState("domcontentloaded");
  const guidedButton = page.locator("#tutorial-overlay").getByRole("button", { name: "Guided Levels" });
  await expect(guidedButton).toBeVisible({ timeout: 20000 });
  await guidedButton.click();
  await waitForHeavyReady(page);
}

export async function chooseFreePlay(page) {
  await page.waitForLoadState("domcontentloaded");
  const freePlayButton = page.locator("#tutorial-overlay").getByRole("button", { name: "Free Play" });
  await expect(freePlayButton).toBeVisible({ timeout: 20000 });
  await freePlayButton.click();
  await waitForHeavyReady(page);
}

export async function dismissTutorial(page) {
  const gotIt = page.locator("#tutorial-overlay").getByRole("button", { name: "Got It" });
  if (await gotIt.count()) {
    await gotIt.click();
  }
}

export async function loadWorkspaceXml(page, xmlText) {
  await page.evaluate((xml) => window.__BBA_TEST_HOOKS__.loadWorkspaceXml(xml), xmlText);
}

export function buildSolutionXml(innerBlockXml) {
  return `
    <xml xmlns="https://developers.google.com/blockly/xml">
      <block type="battlegorithms_on_each_turn" x="24" y="24">
        <next>
          ${innerBlockXml}
        </next>
      </block>
    </xml>
  `;
}
