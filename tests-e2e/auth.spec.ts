import { expect, test } from "@playwright/test";

test("renders the auth landing login form", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Вход в CRM" })).toBeVisible();
  await expect(page.getByLabel("Email").first()).toBeVisible();
  await expect(page.getByLabel("Пароль").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Войти" })).toBeVisible();
});
