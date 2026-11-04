
import { test, expect } from '@playwright/test';

test('la app carga sin errores de JavaScript', async ({ page }) => {
  const errores: string[] = [];

  page.on('pageerror', (error) => {
    errores.push(error.message);
  });

  page.on('console', (message) => {
    if (message.type() === 'error') {
      errores.push(message.text());
    }
  });

  // Simular únicamente endpoints API, nunca módulos del frontend.
  await page.route(
    (url) => url.pathname.startsWith('/api/'),
    (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '[]',
      })
  );

  await page.goto('/', {
    waitUntil: 'domcontentloaded',
  });

  // Esperar a que React monte la aplicación.
  await expect(page.locator('#root')).not.toBeEmpty({
    timeout: 10_000,
  });

  expect(errores).toEqual([]);
});
