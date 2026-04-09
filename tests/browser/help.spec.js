import { test, expect } from "@playwright/test";
import { clearStorageBeforeEach } from "./helpers.js";

clearStorageBeforeEach(test);

test("header help link opens the standalone help page in a new tab", async ({ page }) => {
  await page.goto("/");
  const helpLink = page.locator("#helpLink");
  await expect(helpLink).toHaveAttribute("href", /help\.html$/);
  await expect(helpLink).toHaveAttribute("target", "_blank");
});

test("standalone help page loads the General, Blocks, and Strategy sections", async ({ page }) => {
  await page.goto("/help.html");
  await expect(page.locator(".help-sidebar")).toContainText("General");
  await expect(page.locator(".help-sidebar")).toContainText("Blocks");
  await expect(page.locator(".help-sidebar")).toContainText("Strategy");
  await expect(page.locator(".help-main")).toContainText("What Is Battlegorithms?");
  await expect(page.locator(".help-main")).toContainText("How Block Programs Work");
  await expect(page.locator(".help-main")).toContainText("Free Play Tips");
});

test("help page left navigation jumps to the requested section", async ({ page }) => {
  await page.goto("/help.html");
  await page.locator('.help-nav-group a[href="#strategy-teamwork"]').click();
  await expect(page).toHaveURL(/#strategy-teamwork$/);
  await expect(page.locator("#strategy-teamwork")).toBeInViewport();
});
