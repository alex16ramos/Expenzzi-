import { test, expect } from '@playwright/test';

test.describe('Pruebas E2E de Dashboard e Interfaces', () => {
  test('debe responder adecuadamente al acceder al dashboard', async ({ page }) => {
    // Intentar acceder a la ruta del dashboard
    const response = await page.goto('/dashboard');
    expect(response?.status()).toBeLessThan(500);
  });

  test('debe verificar la carga de componentes visuales en la interfaz', async ({ page }) => {
    await page.goto('/');

    // Comprobar la presencia del contenedor principal o cuerpo de la página
    const mainContainer = page.locator('main').first();
    await expect(mainContainer).toBeVisible();
  });
});
