import { describe, it, expect } from 'vitest';
import { getAvatarBg, getAvatarClass } from '@/lib/avatar-utils';

describe('avatar-utils - AAA Unit Tests', () => {
  describe('getAvatarBg', () => {
    it('debe retornar bg-indigo-600 si no se proporciona fotoperfil', () => {
      // Arrange
      const fotoperfil = undefined;

      // Act
      const result = getAvatarBg(fotoperfil);

      // Assert
      expect(result).toBe('bg-indigo-600');
    });

    it('debe retornar la clase de fondo adecuada para avatares específicos de Los Simpsons', () => {
      // Arrange
      const simpsons = [
        { name: 'homer.png', expected: 'bg-amber-400' },
        { name: 'marge.png', expected: 'bg-sky-400' },
        { name: 'bart.png', expected: 'bg-red-500' },
        { name: 'lisa.png', expected: 'bg-orange-400' },
        { name: 'maggie.png', expected: 'bg-cyan-400' },
      ];

      simpsons.forEach(({ name, expected }) => {
        // Act
        const result = getAvatarBg(`/avatars/${name}`);

        // Assert
        expect(result).toBe(expected);
      });
    });

    it('debe retornar bg-slate-800 para imágenes genéricas o URLs externas', () => {
      // Arrange
      const fotoUrl = 'https://example.com/avatar.jpg';

      // Act
      const result = getAvatarBg(fotoUrl);

      // Assert
      expect(result).toBe('bg-slate-800');
    });
  });

  describe('getAvatarClass', () => {
    it('debe retornar object-contain para avatares conocidos', () => {
      // Arrange
      const fotoUrl = '/avatars/homer.png';

      // Act
      const result = getAvatarClass(fotoUrl);

      // Assert
      expect(result).toBe('w-full h-full object-contain p-0.5');
    });

    it('debe retornar object-cover para imágenes genéricas o nulas', () => {
      // Arrange
      const fotoUrl = 'https://example.com/user.png';

      // Act
      const result = getAvatarClass(fotoUrl);

      // Assert
      expect(result).toBe('w-full h-full object-cover');
    });
  });
});
