import { expect, test } from "@playwright/test";

test("root redirects to the unified login page", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Вход" })).toBeVisible();
  await expect(page.getByLabel("Email").first()).toBeVisible();
  await expect(page.getByLabel("Пароль").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Войти" })).toBeVisible();
});
