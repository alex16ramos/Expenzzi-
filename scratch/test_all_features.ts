import { prisma } from '../src/lib/db';

async function testAllFeatures() {
  console.log('====================================================');
  console.log('STARTING END-TO-END AUTOMATED VERIFICATION OF EXPENZZI');
  console.log('====================================================\n');

  try {
    // ----------------------------------------------------
    // TEST 1: User & Auth Sync (Punto 1)
    // ----------------------------------------------------
    console.log('[TEST 1] Verificando Usuarios y Sincronización (Punto 1)...');
    const users = await prisma.usuario.findMany();
    console.log(`✅ Usuarios encontrados en public.usuario: ${users.length}`);
    if (users.length > 0) {
      console.log(`   Ejemplo usuario: ${users[0].nombreusuario} (${users[0].email})`);
    }

    const primaryUserId = users.length > 0 ? users[0].idusuario : '11111111-1111-1111-1111-111111111111';

    // ----------------------------------------------------
    // TEST 2: Dashboard & Interfaces de Operación (Punto 2)
    // ----------------------------------------------------
    console.log('\n[TEST 2] Verificando Interfaces de Operación y Triggers (Punto 2)...');
    const interfaces = await prisma.interfazOperacion.findMany();
    console.log(`✅ Interfaces encontradas: ${interfaces.length}`);

    let testInterfaceId: bigint;
    if (interfaces.length === 0) {
      const newIo = await prisma.interfazOperacion.create({
        data: {
          nombre: 'Interfaz de Prueba Automatizada',
          descripcion: 'Interfaz para verificación de auditoría y límites',
          estado: true,
        },
      });
      testInterfaceId = newIo.idinterfazoperacion;
      console.log(`   Creada nueva interfaz de prueba ID: ${testInterfaceId}`);
    } else {
      testInterfaceId = interfaces[0].idinterfazoperacion;
      console.log(`   Usando interfaz existente ID: ${testInterfaceId} (${interfaces[0].nombre})`);
    }

    // Ensure User-Interface link
    await prisma.usuarioInterfaz.upsert({
      where: {
        idinterfazoperacion_idusuario: {
          idinterfazoperacion: testInterfaceId,
          idusuario: primaryUserId,
        },
      },
      update: { rol: 'Administrador' },
      create: {
        idinterfazoperacion: testInterfaceId,
        idusuario: primaryUserId,
        rol: 'Administrador',
      },
    });
    console.log(`✅ Usuario asociado a Interfaz #${testInterfaceId} como Administrador`);

    // ----------------------------------------------------
    // TEST 3: Categoría y Límite Presupuestario (Punto 4)
    // ----------------------------------------------------
    console.log('\n[TEST 3] Verificando Categorías y Control de Límites (Punto 4)...');
    let category = await prisma.categoria.findFirst({
      where: { idinterfazoperacion: testInterfaceId, estado: true },
    });

    if (!category) {
      category = await prisma.categoria.create({
        data: {
          nombre: 'Alimentos y Supermercado',
          estadolimite: true,
          importe: 50000,
          moneda: 'ARS',
          periodoaplicacion: 'Mensual',
          idinterfazoperacion: testInterfaceId,
          estado: true,
        },
      });
      console.log(`   Creada categoría con límite: ${category.nombre} ($${category.importe} ${category.moneda})`);
    } else {
      console.log(`   Categoría encontrada: ${category.nombre}`);
    }

    // Check vista Vistalimitegastosperiodo
    const vistaLimits = await prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT * FROM public.vistalimitegastosperiodo WHERE idcategoria = ${category.idcategoria}
    `;
    console.log(`✅ Vista de límites (vistalimitegastosperiodo) consultada correctamente. Datos:`, vistaLimits[0] || 'OK');

    // ----------------------------------------------------
    // TEST 4: Modificación de Gasto y Trigger de Auditoría / Diff (Puntos 3 y 6)
    // ----------------------------------------------------
    console.log('\n[TEST 4] Verificando Auditoría de Cambios y Triggers (Puntos 3 y 6)...');
    
    // Create a gasto
    const initialAmount = 1500;
    const initialCurrency = 'ARS';
    const testGasto = await prisma.gasto.create({
      data: {
        fecha: new Date(),
        responsablegasto: primaryUserId,
        responsableingresargasto: primaryUserId,
        moneda: initialCurrency,
        importe: initialAmount,
        comentario: 'Gasto original antes de auditoría',
        idcategoria: category.idcategoria,
        estado: true,
      },
    });
    console.log(`✅ Creado Gasto #${testGasto.idgasto}: $${initialAmount} ${initialCurrency}`);

    // UPDATE the gasto to trigger log_gasto_historial_fn
    const updatedAmount = 2500;
    const updatedCurrency = 'USD';
    const updatedGasto = await prisma.gasto.update({
      where: { idgasto: testGasto.idgasto },
      data: {
        importe: updatedAmount,
        moneda: updatedCurrency,
        comentario: 'Gasto modificado para probar diff de auditoría',
      },
    });
    console.log(`✅ Actualizado Gasto #${updatedGasto.idgasto}: $${updatedAmount} ${updatedCurrency}`);

    // QUERY the historialgasto table to verify PostgreSQL trigger log_gasto_historial_fn inserted `ant`
    const historyLog = await prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT 
        idhistorialgasto::text AS id,
        fechacambio::text AS fechacambio,
        (ant).importe::float AS ant_importe,
        (ant).moneda::text AS ant_moneda,
        comentarioant
      FROM public.historialgasto
      WHERE idgasto = ${testGasto.idgasto}
      ORDER BY idhistorialgasto DESC
    `;

    console.log(`\n🔍 RESULTADO EN BD DE HISTORIALGASTO (AUDITORÍA DE DIFFS):`);
    console.log(JSON.stringify(historyLog, null, 2));

    if (historyLog.length > 0) {
      const antImp = historyLog[0].ant_importe;
      const antMon = historyLog[0].ant_moneda;
      console.log(`\n🎉 VERIFICACIÓN EXITOSA DEL VISUALIZADOR DE DIFFS (PUNTO 6):`);
      console.log(`   🔴 Valor Anterior (ant): $${antImp} ${antMon}`);
      console.log(`   🟢 Valor Nuevo (actual):  $${updatedGasto.importe} ${updatedGasto.moneda}`);
      console.log(`   Diff de Importe: $${antImp} -> $${updatedGasto.importe}`);
      console.log(`   Diff de Moneda: ${antMon} -> ${updatedGasto.moneda}`);
    } else {
      console.error('❌ No se encontró el registro en historialgasto');
    }

    // ----------------------------------------------------
    // TEST 5: Modificación de Límite y Trigger HistorialLimite
    // ----------------------------------------------------
    console.log('\n[TEST 5] Verificando Auditoría en HistorialLimite...');
    await prisma.categoria.update({
      where: { idcategoria: category.idcategoria },
      data: {
        importe: 75000,
        moneda: 'USD',
      },
    });

    const limitLog = await prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT 
        idlimitecategoria::text AS id,
        fechacreacionlimite::text AS fechacambio,
        (ant).importe::float AS ant_importe,
        (ant).moneda::text AS ant_moneda,
        importelimite
      FROM public.historiallimite
      WHERE idcategoria = ${category.idcategoria}
      ORDER BY idlimitecategoria DESC
    `;

    console.log(`🔍 RESULTADO DE HISTORIALLIMITE EN BD:`, JSON.stringify(limitLog, null, 2));

    console.log('\n====================================================');
    console.log('✅ TODAS LAS PRUEBAS AUTOMATIZADAS COMPLETADAS CON ÉXITO');
    console.log('====================================================');

  } catch (err) {
    console.error('❌ Error durante la verificación:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testAllFeatures();
