import { expect, test } from "@playwright/test";

// Critical chain (route/render smoke, no backend required):
// Admin login -> invite Creator -> create Instance -> register -> invite User.
// Full data-flow assertions run against a live backend; here we verify each
// step's screen and its key controls exist and are reachable.

test("admin login screen is reachable", async ({ page }) => {
  await page.goto("/crm/admin/login");
  await expect(page.getByRole("heading", { name: "Вход администратора" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Пароль")).toBeVisible();
});

test("admin can reach invite-creator screen", async ({ page }) => {
  await page.goto("/crm/admin/invite-creator");
  await expect(page.getByRole("heading", { name: "Пригласить креатора" })).toBeVisible();
  await expect(page.getByLabel("Email креатора")).toBeVisible();
  await expect(page.getByLabel("UUID инстанса")).toBeVisible();
});

test("admin instances screen exposes create + tables", async ({ page }) => {
  await page.goto("/crm/admin/instances");
  await expect(page.getByRole("heading", { name: "Управление инстансами" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Создать инстанс" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Инстансы" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Креаторы" })).toBeVisible();
});

test("register screen is invite-gated", async ({ page }) => {
  await page.goto("/register");
  await expect(page.getByRole("heading", { name: "Регистрация по инвайту" })).toBeVisible();
});

test("instance user-management screen is reachable", async ({ page }) => {
  await page.goto("/instances/00000000-0000-0000-0000-000000000000/manage");
  await expect(page.getByRole("heading", { name: "Пользователи и роли" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Пригласить пользователя" })).toBeVisible();
});
