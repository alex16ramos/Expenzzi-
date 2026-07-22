import { prisma } from '@/lib/db';
import { TMoneda, TPeriodo, TMetodoDePago } from '@prisma/client';

/**
 * Ensures that an interface has initial example data (Categories, Submethods, Gastos, Ingresos, Ahorros)
 * so that tables and UI are immediately filled with realistic demonstration records.
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

    // 2. Check and Seed Categories if empty
    let categories = await prisma.categoria.findMany({
      where: { idinterfazoperacion: interfaceId, estado: true },
    });

    if (categories.length === 0) {
      await prisma.categoria.createMany({
        data: [
          {
            nombre: 'Supermercado & Víveres',
            estadolimite: true,
            importe: 250000,
            moneda: 'ARS' as TMoneda,
            periodoaplicacion: 'Mensual' as TPeriodo,
            fechacreacionlimite: new Date(),
            idinterfazoperacion: interfaceId,
            estado: true,
          },
          {
            nombre: 'Combustible & Vehículo',
            estadolimite: true,
            importe: 120000,
            moneda: 'ARS' as TMoneda,
            periodoaplicacion: 'Mensual' as TPeriodo,
            fechacreacionlimite: new Date(),
            idinterfazoperacion: interfaceId,
            estado: true,
          },
          {
            nombre: 'Servicios & Alquiler',
            estadolimite: false,
            idinterfazoperacion: interfaceId,
            estado: true,
          },
          {
            nombre: 'Restaurantes & Salidas',
            estadolimite: true,
            importe: 500,
            moneda: 'USD' as TMoneda,
            periodoaplicacion: 'Mensual' as TPeriodo,
            fechacreacionlimite: new Date(),
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
            nombre: 'Entretenimiento & Viajes',
            estadolimite: false,
            idinterfazoperacion: interfaceId,
            estado: true,
          },
        ],
      });

      categories = await prisma.categoria.findMany({
        where: { idinterfazoperacion: interfaceId, estado: true },
      });
    }

    // 3. Check and Seed Submethods if empty
    let submethods = await prisma.subMetodoPago.findMany({
      where: { idinterfazoperacion: interfaceId, estado: true },
    });

    if (submethods.length === 0) {
      await prisma.subMetodoPago.createMany({
        data: [
          {
            nombre: 'Débito - Cuenta ARS',
            metodo: 'Debito' as TMetodoDePago,
            idinterfazoperacion: interfaceId,
            estado: true,
          },
          {
            nombre: 'Efectivo ARS',
            metodo: 'Efectivo' as TMetodoDePago,
            idinterfazoperacion: interfaceId,
            estado: true,
          },
          {
            nombre: 'Visa Crédito Santander',
            metodo: 'Credito' as TMetodoDePago,
            idinterfazoperacion: interfaceId,
            estado: true,
          },
          {
            nombre: 'Prex UY Débito',
            metodo: 'Debito' as TMetodoDePago,
            idinterfazoperacion: interfaceId,
            estado: true,
          },
          {
            nombre: 'Dólares Efectivo',
            metodo: 'Efectivo' as TMetodoDePago,
            idinterfazoperacion: interfaceId,
            estado: true,
          },
        ],
      });

      submethods = await prisma.subMetodoPago.findMany({
        where: { idinterfazoperacion: interfaceId, estado: true },
      });
    }

    // 4. Check and Seed Gastos if empty
    const existingGastosCount = await prisma.gasto.count({
      where: {
        estado: true,
        OR: [
          { categoria: { idinterfazoperacion: interfaceId } },
          { submetodopago: { idinterfazoperacion: interfaceId } },
        ],
      },
    });

    if (existingGastosCount === 0 && categories.length > 0 && submethods.length > 0) {
      const catSuper = categories.find((c) => c.nombre.includes('Supermercado')) || categories[0];
      const catComb = categories.find((c) => c.nombre.includes('Combustible')) || categories[0];
      const catRest = categories.find((c) => c.nombre.includes('Restaurantes')) || categories[0];
      const catServ = categories.find((c) => c.nombre.includes('Servicios')) || categories[0];

      const subDeb = submethods.find((s) => s.metodo === 'Debito') || submethods[0];
      const subEf = submethods.find((s) => s.metodo === 'Efectivo') || submethods[0];
      const subCred = submethods.find((s) => s.metodo === 'Credito') || submethods[0];

      await prisma.gasto.createMany({
        data: [
          {
            fecha: new Date(),
            responsablegasto: userId,
            responsableingresargasto: userId,
            moneda: 'ARS' as TMoneda,
            importe: 45800,
            comentario: 'Supermercado semanal Coto',
            idcategoria: catSuper.idcategoria,
            idsubmetodopago: subDeb.idsubmetodopago,
            estado: true,
          },
          {
            fecha: new Date(Date.now() - 24 * 60 * 60 * 1000),
            responsablegasto: userId,
            responsableingresargasto: userId,
            moneda: 'ARS' as TMoneda,
            importe: 22000,
            comentario: 'Carga Nafta YPF Infinia',
            idcategoria: catComb.idcategoria,
            idsubmetodopago: subEf.idsubmetodopago,
            estado: true,
          },
          {
            fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            responsablegasto: userId,
            responsableingresargasto: userId,
            moneda: 'USD' as TMoneda,
            importe: 120,
            comentario: 'Cena grupal en Restaurante',
            idcategoria: catRest.idcategoria,
            idsubmetodopago: subCred.idsubmetodopago,
            estado: true,
          },
          {
            fecha: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            responsablegasto: userId,
            responsableingresargasto: userId,
            moneda: 'UYU' as TMoneda,
            importe: 1800,
            comentario: 'Paseo & compras Punta del Este',
            idcategoria: catRest.idcategoria,
            idsubmetodopago: subDeb.idsubmetodopago,
            estado: true,
          },
          {
            fecha: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            responsablegasto: userId,
            responsableingresargasto: userId,
            moneda: 'ARS' as TMoneda,
            importe: 65000,
            comentario: 'Pago factura Expensas',
            idcategoria: catServ.idcategoria,
            idsubmetodopago: subDeb.idsubmetodopago,
            estado: true,
          },
        ],
      });
    }

    // 5. Check and Seed Ingresos if empty
    const existingIngresosCount = await prisma.ingreso.count({
      where: { idinterfazoperacion: interfaceId, estado: true },
    });

    if (existingIngresosCount === 0) {
      await prisma.ingreso.createMany({
        data: [
          {
            fecha: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            responsableingreso: userId,
            responsableingresaringreso: userId,
            moneda: 'ARS' as TMoneda,
            importe: 980000,
            comentario: 'Sueldo principal acreditación mensual',
            idinterfazoperacion: interfaceId,
            estado: true,
          },
          {
            fecha: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            responsableingreso: userId,
            responsableingresaringreso: userId,
            moneda: 'USD' as TMoneda,
            importe: 800,
            comentario: 'Cobro trabajo freelance exterior',
            idinterfazoperacion: interfaceId,
            estado: true,
          },
          {
            fecha: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
            responsableingreso: userId,
            responsableingresaringreso: userId,
            moneda: 'UYU' as TMoneda,
            importe: 15000,
            comentario: 'Devolución alquiler temporal UY',
            idinterfazoperacion: interfaceId,
            estado: true,
          },
        ],
      });
    }

    // 6. Check and Seed Ahorros if empty
    const existingAhorrosCount = await prisma.ahorro.count({
      where: { idinterfazoperacion: interfaceId, estado: true },
    });

    if (existingAhorrosCount === 0) {
      await prisma.ahorro.createMany({
        data: [
          {
            fechadesde: new Date(),
            fechahasta: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
            moneda: 'USD' as TMoneda,
            importe: 1500,
            comentario: 'Fondo de Emergencia Familiar (USD)',
            periodoaporte: 'Mensual' as TPeriodo,
            idinterfazoperacion: interfaceId,
            estado: true,
          },
          {
            fechadesde: new Date(),
            fechahasta: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            moneda: 'ARS' as TMoneda,
            importe: 250000,
            comentario: 'Reserva para mantenimiento vehículo',
            periodoaporte: 'Mensual' as TPeriodo,
            idinterfazoperacion: interfaceId,
            estado: true,
          },
          {
            fechadesde: new Date(),
            fechahasta: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            moneda: 'UYU' as TMoneda,
            importe: 40000,
            comentario: 'Fondo Vacaciones Uruguay 2027',
            periodoaporte: 'Trimestral' as TPeriodo,
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
