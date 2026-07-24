import { prisma } from '../src/lib/db';

async function updateLogTriggers() {
  console.log('Actualizando triggers log_gasto_historial_fn y log_ingreso_historial_fn en Neon...');
  try {
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION public.log_gasto_historial_fn()
      RETURNS TRIGGER AS $$
      DECLARE
        v_uid uuid;
      BEGIN
        BEGIN
          v_uid := auth.uid();
        EXCEPTION WHEN OTHERS THEN
          v_uid := OLD.responsablegasto;
        END;

        IF (OLD.importe <> NEW.importe OR OLD.moneda <> NEW.moneda OR COALESCE(OLD.comentario, '') <> COALESCE(NEW.comentario, '')) THEN
          INSERT INTO public.historialgasto (fechacambio, responsablecambio, ant, comentarioant, idgasto)
          VALUES (
            CURRENT_DATE, 
            COALESCE(v_uid, OLD.responsablegasto), 
            ROW(OLD.importe, OLD.moneda)::timportemoneda, 
            OLD.comentario, 
            OLD.idgasto
          );
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION public.log_ingreso_historial_fn()
      RETURNS TRIGGER AS $$
      DECLARE
        v_uid uuid;
      BEGIN
        BEGIN
          v_uid := auth.uid();
        EXCEPTION WHEN OTHERS THEN
          v_uid := OLD.responsableingreso;
        END;

        IF (OLD.importe <> NEW.importe OR OLD.moneda <> NEW.moneda OR COALESCE(OLD.comentario, '') <> COALESCE(NEW.comentario, '')) THEN
          INSERT INTO public.historialingreso (fechacambio, responsablecambio, ant, comentarioant, idingreso)
          VALUES (
            CURRENT_DATE, 
            COALESCE(v_uid, OLD.responsableingreso), 
            ROW(OLD.importe, OLD.moneda)::timportemoneda, 
            OLD.comentario, 
            OLD.idingreso
          );
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('✅ Triggers log_gasto_historial_fn y log_ingreso_historial_fn actualizados con éxito');
  } catch (err) {
    console.error('Error actualizando triggers de historial:', err);
  } finally {
    await prisma.$disconnect();
  }
}

updateLogTriggers();
