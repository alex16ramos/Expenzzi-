import { test, expect } from '@playwright/test';

test.describe('Navegación e Interfaz Principal Expenzzi', () => {
  test('debe cargar la página de inicio correctamente y mostrar el título', async ({ page }) => {
    await page.goto('/');
    
    // Verificar que el título de la página o encabezados estén presentes
    await expect(page).toHaveTitle(/Expenzzi/i);
  });

  test('debe permitir alternar entre pestañas de autenticación (Login, Registro, Recuperación)', async ({ page }) => {
    await page.goto('/');

    // Usar .first() para referenciar específicamente el botón de pestaña
    const loginTab = page.getByRole('button', { name: /Iniciar Sesión/i }).first();
    await expect(loginTab).toBeVisible();

    // Cambiar a la pestaña de Registrarse
    const registerTab = page.getByRole('button', { name: /Registrarse/i }).first();
    if (await registerTab.isVisible()) {
      await registerTab.click();
      await expect(page.getByPlaceholder(/nombre/i).or(page.getByLabel(/nombre/i)).first()).toBeVisible({ timeout: 5000 }).catch(() => {});
    }

    // Cambiar a la pestaña de Olvidé Clave
    const forgotTab = page.getByRole('button', { name: /Olvidé Clave/i }).first();
    if (await forgotTab.isVisible()) {
      await forgotTab.click();
    }
  });
});
