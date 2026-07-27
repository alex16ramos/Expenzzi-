import { prisma } from '@/lib/db';
import { TMetodoDePago } from '@prisma/client';

/**
 * Ensures that an interface has base Categories and Submethods of Payment upon creation.
 * Does NOT generate mock transactions (gastos, ingresos, ahorros) so that interfaces start completely empty.
 */
export async function ensureDemoDataForInterface(interfaceId: bigint, userId: string) {
  try {
    // 1. Ensure user exists in custom 'usuario' table
    await prisma.usuario.upsert({
      where: { idusuario: userId },
      update: {},
      create: {
        idusuario: userId,
        nombreusuario: 'Usuario Expenzzi',
        email: `${userId}@expenzzi.local`,
      },
    });

    // 2. Check and Seed Base Categories if empty
    const categoriesCount = await prisma.categoria.count({
      where: { idinterfazoperacion: interfaceId, estado: true },
    });

    if (categoriesCount === 0) {
      await prisma.categoria.createMany({
        data: [
          {
            nombre: 'Alimentación & Supermercado',
            estadolimite: false,
            idinterfazoperacion: interfaceId,
            estado: true,
          },
          {
            nombre: 'Vivienda & Alquiler',
            estadolimite: false,
            idinterfazoperacion: interfaceId,
            estado: true,
          },
          {
            nombre: 'Servicios & Luz/Agua/Internet',
            estadolimite: false,
            idinterfazoperacion: interfaceId,
            estado: true,
          },
          {
            nombre: 'Transporte & Combustible',
            estadolimite: false,
            idinterfazoperacion: interfaceId,
            estado: true,
          },
          {
            nombre: 'Salud & Farmacia',
            estadolimite: false,
            idinterfazoperacion: interfaceId,
            estado: true,
          },
          {
            nombre: 'Educación & Cursos',
            estadolimite: false,
            idinterfazoperacion: interfaceId,
            estado: true,
          },
          {
            nombre: 'Ropa & Calzado',
            estadolimite: false,
            idinterfazoperacion: interfaceId,
            estado: true,
          },
          {
            nombre: 'Entretenimiento & Salidas',
            estadolimite: false,
            idinterfazoperacion: interfaceId,
            estado: true,
          },
          {
            nombre: 'Seguros & Impuestos',
            estadolimite: false,
            idinterfazoperacion: interfaceId,
            estado: true,
          },
          {
            nombre: 'Otros',
            estadolimite: false,
            idinterfazoperacion: interfaceId,
            estado: true,
          },
        ],
      });
    }

    // 3. Check and Seed Base Submethods if empty
    const submethodsCount = await prisma.subMetodoPago.count({
      where: { idinterfazoperacion: interfaceId, estado: true },
    });

    if (submethodsCount === 0) {
      await prisma.subMetodoPago.createMany({
        data: [
          {
            nombre: 'Efectivo',
            metodo: 'Efectivo' as TMetodoDePago,
            idinterfazoperacion: interfaceId,
            estado: true,
          },
          {
            nombre: 'Tarjeta de Débito',
            metodo: 'Debito' as TMetodoDePago,
            idinterfazoperacion: interfaceId,
            estado: true,
          },
          {
            nombre: 'Tarjeta de Crédito',
            metodo: 'Credito' as TMetodoDePago,
            idinterfazoperacion: interfaceId,
            estado: true,
          },
        ],
      });
    }
  } catch (err) {
    console.error('[ensureDemoDataForInterface Error]:', err);
  }
}
