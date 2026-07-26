-- ==========================================
-- SETUP SCRIPT FOR NEON DATABASE (EXPENZZI)
-- ==========================================

-- 1. Create schemas if they do not exist
CREATE SCHEMA IF NOT EXISTS "public";
CREATE SCHEMA IF NOT EXISTS "neon_auth";

-- 2. Create Custom Types
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tmetododepago') THEN
    CREATE TYPE "tmetododepago" AS ENUM('Efectivo', 'Credito', 'Debito');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tmoneda') THEN
    CREATE TYPE "tmoneda" AS ENUM('ARS', 'USD', 'UYU');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tperiodo') THEN
    CREATE TYPE "tperiodo" AS ENUM('Anual', 'Trimestral', 'Mensual', 'Semanal');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trol') THEN
    CREATE TYPE "trol" AS ENUM('Administrador', 'Invitado', 'Visualizador');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'timportes') THEN
    CREATE TYPE "timportes" AS (importears numeric(12,2), importeusd numeric(12,2), importeuyu numeric(12,2));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'timportemoneda') THEN
    CREATE TYPE "timportemoneda" AS (importe numeric(12,2), moneda tmoneda);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'testadoamistad') THEN
    CREATE TYPE "testadoamistad" AS ENUM('Pendiente', 'Aceptado', 'Rechazado');
  END IF;
END $$;

-- 3. Create Tables
CREATE TABLE IF NOT EXISTS "usuario" (
  "idusuario" uuid PRIMARY KEY,
  "nombreusuario" varchar NOT NULL,
  "email" varchar NOT NULL CONSTRAINT "usuario_email_key" UNIQUE,
  "fotoperfil" varchar,
  "biografia" varchar,
  "telefono" varchar
);

ALTER TABLE "usuario" ADD COLUMN IF NOT EXISTS "fotoperfil" varchar;
ALTER TABLE "usuario" ADD COLUMN IF NOT EXISTS "biografia" varchar;
ALTER TABLE "usuario" ADD COLUMN IF NOT EXISTS "telefono" varchar;
ALTER TABLE "usuario" ADD COLUMN IF NOT EXISTS "temapreferido" varchar(20) DEFAULT 'system';

CREATE TABLE IF NOT EXISTS "notificacion" (
  "idnotificacion" bigserial PRIMARY KEY,
  "idreceptor" uuid NOT NULL REFERENCES "usuario"("idusuario") ON DELETE CASCADE,
  "idemisor" uuid NOT NULL REFERENCES "usuario"("idusuario") ON DELETE CASCADE,
  "tipo" varchar(50) DEFAULT 'INVITACION_INTERFAZ' NOT NULL,
  "titulo" varchar(100) NOT NULL,
  "mensaje" text,
  "idinterfazoperacion" bigint REFERENCES "interfazoperacion"("idinterfazoperacion") ON DELETE CASCADE,
  "rol_propuesto" trol DEFAULT 'Invitado'::trol,
  "estado" varchar(20) DEFAULT 'Pendiente' NOT NULL,
  "leido" boolean DEFAULT false NOT NULL,
  "fechacreacion" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "amistad" (
  "idamistad" bigserial PRIMARY KEY,
  "idremitente" uuid NOT NULL REFERENCES "usuario"("idusuario") ON DELETE CASCADE,
  "iddestinatario" uuid NOT NULL REFERENCES "usuario"("idusuario") ON DELETE CASCADE,
  "estado" testadoamistad DEFAULT 'Pendiente'::testadoamistad NOT NULL,
  "fechacreacion" date DEFAULT CURRENT_DATE NOT NULL,
  CONSTRAINT "amistad_remitente_destinatario_key" UNIQUE("idremitente", "iddestinatario")
);


CREATE TABLE IF NOT EXISTS "interfazoperacion" (
  "idinterfazoperacion" bigserial PRIMARY KEY,
  "nombre" varchar(50) NOT NULL,
  "descripcion" varchar,
  "fechacreacion" date DEFAULT CURRENT_DATE NOT NULL,
  "estado" boolean DEFAULT true,
  "linkinvitado" varchar DEFAULT gen_random_uuid(),
  "linkvisualizador" varchar DEFAULT gen_random_uuid(),
  "balancegeneral" timportes
);

CREATE TABLE IF NOT EXISTS "usuariointerfaz" (
  "rol" trol,
  "fechaunion" date DEFAULT CURRENT_DATE NOT NULL,
  "fechasalida" date,
  "idinterfazoperacion" bigint REFERENCES "interfazoperacion"("idinterfazoperacion") ON DELETE CASCADE,
  "idusuario" uuid REFERENCES "usuario"("idusuario") ON DELETE CASCADE,
  CONSTRAINT "usuariointerfaz_idinterfazoperacion_idusuario_key" UNIQUE("idinterfazoperacion","idusuario")
);

CREATE TABLE IF NOT EXISTS "ahorro" (
  "idahorro" bigserial PRIMARY KEY,
  "fechadesde" date DEFAULT CURRENT_DATE NOT NULL,
  "fechahasta" date NOT NULL,
  "moneda" tmoneda NOT NULL,
  "importe" numeric(12, 2) NOT NULL,
  "comentario" varchar,
  "periodoaporte" tperiodo,
  "importes" timportes,
  "estado" boolean DEFAULT true,
  "idinterfazoperacion" bigint REFERENCES "interfazoperacion"("idinterfazoperacion") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "cambio" (
  "idcambio" bigserial PRIMARY KEY,
  "fecha" date DEFAULT CURRENT_DATE NOT NULL,
  "cambiouyuusd" numeric(12, 4),
  "cambiouyuars" numeric(12, 4),
  "cambiousduyu" numeric(12, 4),
  "cambiousdars" numeric(12, 4),
  "cambioarsuyu" numeric(12, 4),
  "cambioarsusd" numeric(12, 4)
);

CREATE TABLE IF NOT EXISTS "categoria" (
  "idcategoria" bigserial PRIMARY KEY,
  "nombre" varchar(50) NOT NULL,
  "estadolimite" boolean DEFAULT false,
  "importe" numeric(12, 2),
  "moneda" tmoneda,
  "importes" timportes,
  "estado" boolean DEFAULT true,
  "idinterfazoperacion" bigint REFERENCES "interfazoperacion"("idinterfazoperacion") ON DELETE CASCADE,
  "fechacreacionlimite" date,
  "periodoaplicacion" tperiodo
);

CREATE TABLE IF NOT EXISTS "submetodopago" (
  "idsubmetodopago" bigserial PRIMARY KEY,
  "nombre" varchar(50) NOT NULL,
  "metodo" tmetododepago NOT NULL,
  "estado" boolean DEFAULT true,
  "idinterfazoperacion" bigint REFERENCES "interfazoperacion"("idinterfazoperacion") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "gasto" (
  "idgasto" bigserial PRIMARY KEY,
  "fecha" date DEFAULT CURRENT_DATE NOT NULL,
  "responsablegasto" uuid NOT NULL REFERENCES "usuario"("idusuario"),
  "moneda" tmoneda NOT NULL,
  "importe" numeric(12, 2) NOT NULL,
  "comentario" varchar,
  "importes" timportes,
  "responsableingresargasto" uuid NOT NULL REFERENCES "usuario"("idusuario"),
  "estado" boolean DEFAULT true,
  "idcategoria" bigint REFERENCES "categoria"("idcategoria") ON DELETE SET NULL,
  "idsubmetodopago" bigint REFERENCES "submetodopago"("idsubmetodopago") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "ingreso" (
  "idingreso" bigserial PRIMARY KEY,
  "fecha" date DEFAULT CURRENT_DATE NOT NULL,
  "responsableingreso" uuid NOT NULL REFERENCES "usuario"("idusuario"),
  "moneda" tmoneda NOT NULL,
  "importe" numeric(12, 2) NOT NULL,
  "comentario" varchar,
  "importes" timportes,
  "responsableingresaringreso" uuid NOT NULL REFERENCES "usuario"("idusuario"),
  "estado" boolean DEFAULT true,
  "idinterfazoperacion" bigint REFERENCES "interfazoperacion"("idinterfazoperacion") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "historialahorro" (
  "idhistorialahorro" bigserial PRIMARY KEY,
  "fechacambio" date DEFAULT CURRENT_DATE NOT NULL,
  "ant" timportemoneda,
  "comentarioant" varchar,
  "idahorro" bigint REFERENCES "ahorro"("idahorro") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "historialgasto" (
  "idhistorialgasto" bigserial PRIMARY KEY,
  "fechacambio" date DEFAULT CURRENT_DATE NOT NULL,
  "responsablecambio" uuid NOT NULL REFERENCES "usuario"("idusuario"),
  "ant" timportemoneda,
  "comentarioant" varchar,
  "idgasto" bigint REFERENCES "gasto"("idgasto") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "historialingreso" (
  "idhistorialingreso" bigserial PRIMARY KEY,
  "fechacambio" date DEFAULT CURRENT_DATE NOT NULL,
  "responsablecambio" uuid NOT NULL REFERENCES "usuario"("idusuario"),
  "ant" timportemoneda,
  "comentarioant" varchar,
  "idingreso" bigint REFERENCES "ingreso"("idingreso") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "historiallimite" (
  "idlimitecategoria" bigserial PRIMARY KEY,
  "periodoaplicacion" tperiodo NOT NULL,
  "importeutilizado" numeric(12, 2),
  "ant" timportemoneda,
  "idcategoria" bigint REFERENCES "categoria"("idcategoria") ON DELETE CASCADE,
  "fechacreacionlimite" date NOT NULL,
  "importelimite" numeric(9, 2)
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE "usuario" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "interfazoperacion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "usuariointerfaz" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ahorro" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cambio" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "categoria" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "submetodopago" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gasto" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ingreso" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "historialahorro" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "historialgasto" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "historialingreso" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "historiallimite" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "amistad" ENABLE ROW LEVEL SECURITY;

-- 5. Create Missing Indexes for Performance
CREATE UNIQUE INDEX IF NOT EXISTS "ahorro_pkey" ON "ahorro" ("idahorro");
CREATE INDEX IF NOT EXISTS "idx_idinterfazoperacion_fechadesde_fechahasta_estado" ON "ahorro" ("idinterfazoperacion","fechadesde","fechahasta","estado");
CREATE UNIQUE INDEX IF NOT EXISTS "cambio_pkey" ON "cambio" ("idcambio");
CREATE INDEX IF NOT EXISTS "idx_fecha" ON "cambio" ("fecha");
CREATE UNIQUE INDEX IF NOT EXISTS "categoria_pkey" ON "categoria" ("idcategoria");
CREATE INDEX IF NOT EXISTS "idx_idinterfazoperacion_nombre_estado" ON "categoria" ("idinterfazoperacion","nombre","estado");
CREATE UNIQUE INDEX IF NOT EXISTS "gasto_pkey" ON "gasto" ("idgasto");
CREATE INDEX IF NOT EXISTS "idx_idcategoria_fecha_estado" ON "gasto" ("idcategoria","fecha","estado");
CREATE UNIQUE INDEX IF NOT EXISTS "historialahorro_pkey" ON "historialahorro" ("idhistorialahorro");
CREATE INDEX IF NOT EXISTS "idx_idahorro" ON "historialahorro" ("idahorro");
CREATE UNIQUE INDEX IF NOT EXISTS "historialgasto_pkey" ON "historialgasto" ("idhistorialgasto");
CREATE INDEX IF NOT EXISTS "idx_idgasto" ON "historialgasto" ("idgasto");
CREATE UNIQUE INDEX IF NOT EXISTS "historialingreso_pkey" ON "historialingreso" ("idhistorialingreso");
CREATE INDEX IF NOT EXISTS "idx_idingreso" ON "historialingreso" ("idingreso");
CREATE UNIQUE INDEX IF NOT EXISTS "historiallimite_pkey" ON "historiallimite" ("idlimitecategoria");
CREATE INDEX IF NOT EXISTS "idx_idcategoria" ON "historiallimite" ("idcategoria");
CREATE INDEX IF NOT EXISTS "idx_idinterfazoperacion_fecha_estado" ON "ingreso" ("idinterfazoperacion","fecha","estado");
CREATE UNIQUE INDEX IF NOT EXISTS "ingreso_pkey" ON "ingreso" ("idingreso");
CREATE INDEX IF NOT EXISTS "idx_io_nombre_estado" ON "interfazoperacion" ("nombre","estado");
CREATE UNIQUE INDEX IF NOT EXISTS "interfazoperacion_pkey" ON "interfazoperacion" ("idinterfazoperacion");
CREATE UNIQUE INDEX IF NOT EXISTS "submetodopago_pkey" ON "submetodopago" ("idsubmetodopago");
CREATE UNIQUE INDEX IF NOT EXISTS "usuario_pkey" ON "usuario" ("idusuario");
CREATE INDEX IF NOT EXISTS "idx_usuario_email" ON "usuario" ("email");
CREATE INDEX IF NOT EXISTS "idx_usuariointerfaz_idusuario" ON "usuariointerfaz" ("idusuario");
CREATE INDEX IF NOT EXISTS "idx_usuariointerfaz_idinterfaz_idusuario" ON "usuariointerfaz" ("idinterfazoperacion","idusuario");
CREATE INDEX IF NOT EXISTS "idx_gasto_submetodopago" ON "gasto" ("idsubmetodopago");
CREATE INDEX IF NOT EXISTS "idx_submetodopago_idinterfazoperacion" ON "submetodopago" ("idinterfazoperacion");
CREATE UNIQUE INDEX IF NOT EXISTS "amistad_pkey" ON "amistad" ("idamistad");
CREATE INDEX IF NOT EXISTS "idx_amistad_idremitente" ON "amistad" ("idremitente");
CREATE INDEX IF NOT EXISTS "idx_amistad_iddestinatario" ON "amistad" ("iddestinatario");

-- 6. Trigger to Sync Neon Auth Users to Public.Usuario
CREATE OR REPLACE FUNCTION public.sync_usuario_fn()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    BEGIN
      INSERT INTO public.usuario (nombreusuario, email, contrasena)
      VALUES (COALESCE(NEW.name, 'Usuario'), NEW.email, 'NEON_AUTH')
      ON CONFLICT (email) DO UPDATE
      SET nombreusuario = EXCLUDED.nombreusuario;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'sync_usuario_fn insert error: %', SQLERRM;
    END;
  ELSIF (TG_OP = 'UPDATE') THEN
    BEGIN
      UPDATE public.usuario
      SET nombreusuario = COALESCE(NEW.name, nombreusuario)
      WHERE email = NEW.email;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'sync_usuario_fn update error: %', SQLERRM;
    END;
  ELSIF (TG_OP = 'DELETE') THEN
    BEGIN
      DELETE FROM public.usuario WHERE email = OLD.email;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'sync_usuario_fn delete error: %', SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Connect sync trigger to neon_auth.user table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'neon_auth' AND tablename = 'user') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_neon_user_change') THEN
      CREATE TRIGGER on_neon_user_change
      AFTER INSERT OR UPDATE OR DELETE ON neon_auth.user
      FOR EACH ROW EXECUTE FUNCTION public.sync_usuario_fn();
    END IF;
  END IF;
END $$;

-- 7. Trigger Function for Automatic Currency Conversions (timportes)
CREATE OR REPLACE FUNCTION public.calcular_importes_trigger_fn()
RETURNS TRIGGER AS $$
DECLARE
  v_latest_cambio RECORD;
  v_ars numeric;
  v_usd numeric;
  v_uyu numeric;
BEGIN
  -- Get the latest exchange rates. If no rates exist, default to reasonable fallbacks
  SELECT * INTO v_latest_cambio 
  FROM public.cambio 
  ORDER BY fecha DESC, idcambio DESC 
  LIMIT 1;

  IF NOT FOUND THEN
    v_latest_cambio := ROW(
      1, -- idcambio
      CURRENT_DATE, -- fecha
      0.025, -- cambiouyuusd
      0.5, -- cambiouyuars
      40.0, -- cambiousduyu
      1000.0, -- cambiousdars
      2.0, -- cambioarsuyu
      0.001 -- cambioarsusd
    );
  END IF;

  -- Compute values based on the inserted currency (NEW.moneda)
  IF NEW.moneda = 'ARS'::tmoneda THEN
    v_ars := NEW.importe;
    v_usd := NEW.importe * COALESCE(v_latest_cambio.cambioarsusd, 0.001);
    v_uyu := NEW.importe * COALESCE(v_latest_cambio.cambioarsuyu, 2.0);
  ELSIF NEW.moneda = 'USD'::tmoneda THEN
    v_usd := NEW.importe;
    v_ars := NEW.importe * COALESCE(v_latest_cambio.cambiousdars, 1000.0);
    v_uyu := NEW.importe * COALESCE(v_latest_cambio.cambiousduyu, 40.0);
  ELSIF NEW.moneda = 'UYU'::tmoneda THEN
    v_uyu := NEW.importe;
    v_usd := NEW.importe * COALESCE(v_latest_cambio.cambiouyuusd, 0.025);
    v_ars := NEW.importe * COALESCE(v_latest_cambio.cambiouyuars, 0.5);
  END IF;

  NEW.importes := ROW(v_ars, v_usd, v_uyu)::timportes;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply calculation triggers
CREATE OR REPLACE TRIGGER t_calculate_importes_ahorro
BEFORE INSERT OR UPDATE ON public.ahorro
FOR EACH ROW EXECUTE FUNCTION public.calcular_importes_trigger_fn();

CREATE OR REPLACE TRIGGER t_calculate_importes_gasto
BEFORE INSERT OR UPDATE ON public.gasto
FOR EACH ROW EXECUTE FUNCTION public.calcular_importes_trigger_fn();

CREATE OR REPLACE TRIGGER t_calculate_importes_ingreso
BEFORE INSERT OR UPDATE ON public.ingreso
FOR EACH ROW EXECUTE FUNCTION public.calcular_importes_trigger_fn();

-- 8. Trigger Functions for History Audit Log
-- Gasto update log
CREATE OR REPLACE FUNCTION public.log_gasto_historial_fn()
RETURNS TRIGGER AS $$
DECLARE
  v_uid uuid;
BEGIN
  v_uid := public.current_user_id();

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

CREATE OR REPLACE TRIGGER t_log_gasto_historial
AFTER UPDATE ON public.gasto
FOR EACH ROW EXECUTE FUNCTION public.log_gasto_historial_fn();

-- Ingreso update log
CREATE OR REPLACE FUNCTION public.log_ingreso_historial_fn()
RETURNS TRIGGER AS $$
DECLARE
  v_uid uuid;
BEGIN
  v_uid := public.current_user_id();

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

CREATE OR REPLACE TRIGGER t_log_ingreso_historial
AFTER UPDATE ON public.ingreso
FOR EACH ROW EXECUTE FUNCTION public.log_ingreso_historial_fn();

-- Ahorro update log
CREATE OR REPLACE FUNCTION public.log_ahorro_historial_fn()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.importe <> NEW.importe OR OLD.moneda <> NEW.moneda OR COALESCE(OLD.comentario, '') <> COALESCE(NEW.comentario, '')) THEN
    INSERT INTO public.historialahorro (fechacambio, ant, comentarioant, idahorro)
    VALUES (
      CURRENT_DATE, 
      ROW(OLD.importe, OLD.moneda)::timportemoneda, 
      OLD.comentario, 
      OLD.idahorro
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER t_log_ahorro_historial
AFTER UPDATE ON public.ahorro
FOR EACH ROW EXECUTE FUNCTION public.log_ahorro_historial_fn();

-- Categoria / Limites update log
CREATE OR REPLACE FUNCTION public.log_categoria_limite_historial_fn()
RETURNS TRIGGER AS $$
DECLARE
  v_importe_utilizado numeric(12, 2);
BEGIN
  IF (COALESCE(OLD.importe, 0) <> COALESCE(NEW.importe, 0) OR COALESCE(OLD.moneda, 'USD'::tmoneda) <> COALESCE(NEW.moneda, 'USD'::tmoneda) OR COALESCE(OLD.periodoaplicacion, 'Mensual'::tperiodo) <> COALESCE(NEW.periodoaplicacion, 'Mensual'::tperiodo) OR OLD.estadolimite <> NEW.estadolimite) THEN
    v_importe_utilizado := 0;

    INSERT INTO public.historiallimite (periodoaplicacion, importeutilizado, ant, idcategoria, fechacreacionlimite, importelimite)
    VALUES (
      COALESCE(NEW.periodoaplicacion, OLD.periodoaplicacion, 'Mensual'::tperiodo),
      COALESCE(v_importe_utilizado, 0),
      ROW(OLD.importe, OLD.moneda)::timportemoneda,
      OLD.idcategoria,
      COALESCE(OLD.fechacreacionlimite, CURRENT_DATE),
      NEW.importe
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER t_log_categoria_limite_historial
AFTER UPDATE ON public.categoria
FOR EACH ROW EXECUTE FUNCTION public.log_categoria_limite_historial_fn();

-- 9. Trigger to Auto-Associate Creator of InterfazOperacion as Administrador
CREATE OR REPLACE FUNCTION public.associate_creator_admin_fn()
RETURNS TRIGGER AS $$
DECLARE
  v_uid uuid;
BEGIN
  v_uid := public.current_user_id();
  IF v_uid IS NOT NULL THEN
    INSERT INTO public.usuariointerfaz (rol, idinterfazoperacion, idusuario, fechaunion)
    VALUES ('Administrador'::trol, NEW.idinterfazoperacion, v_uid, CURRENT_DATE)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER t_associate_creator_admin
AFTER INSERT ON public.interfazoperacion
FOR EACH ROW EXECUTE FUNCTION public.associate_creator_admin_fn();

-- 10. Stored Procedures (RPC)
-- Join interface via invitation code
CREATE OR REPLACE FUNCTION public.unirse_a_interfaz(p_codigo uuid)
RETURNS json AS $$
DECLARE
  v_idinterfaz bigint;
  v_rol trol;
  v_existing RECORD;
  v_res json;
  v_uid uuid;
BEGIN
  v_uid := public.current_user_id();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  SELECT idinterfazoperacion, 
         CASE 
           WHEN linkinvitado::uuid = p_codigo THEN 'Invitado'::trol
           WHEN linkvisualizador::uuid = p_codigo THEN 'Visualizador'::trol
         END INTO v_idinterfaz, v_rol
  FROM public.interfazoperacion
  WHERE (linkinvitado::uuid = p_codigo OR linkvisualizador::uuid = p_codigo) 
    AND estado = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Código de invitación inválido o interfaz inactiva';
  END IF;

  SELECT * INTO v_existing 
  FROM public.usuariointerfaz 
  WHERE idinterfazoperacion = v_idinterfaz AND idusuario = v_uid;

  IF FOUND THEN
    IF v_existing.fechasalida IS NULL THEN
      v_res := json_build_object(
        'message', 'Ya estás asociado a esta interfaz',
        'data', row_to_json(v_existing)
      );
    ELSE
      UPDATE public.usuariointerfaz
      SET fechasalida = NULL,
          fechaunion = CURRENT_DATE,
          rol = v_rol
      WHERE idinterfazoperacion = v_idinterfaz AND idusuario = v_uid
      RETURNING * INTO v_existing;

      v_res := json_build_object(
        'message', 'Se ha unido nuevamente con éxito',
        'data', row_to_json(v_existing)
      );
    END IF;
  ELSE
    INSERT INTO public.usuariointerfaz (rol, idinterfazoperacion, idusuario, fechaunion)
    VALUES (v_rol, v_idinterfaz, v_uid, CURRENT_DATE)
    RETURNING * INTO v_existing;

    v_res := json_build_object(
      'message', 'Unido correctamente',
      'data', row_to_json(v_existing)
    );
  END IF;

  RETURN v_res;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Leave interface
CREATE OR REPLACE FUNCTION public.salir_de_interfaz(p_idinterfaz bigint)
RETURNS json AS $$
DECLARE
  v_updated RECORD;
  v_uid uuid;
BEGIN
  v_uid := public.current_user_id();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  UPDATE public.usuariointerfaz
  SET fechasalida = CURRENT_DATE
  WHERE idinterfazoperacion = p_idinterfaz 
    AND idusuario = v_uid 
    AND fechasalida IS NULL
  RETURNING * INTO v_updated;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No estás asociado o ya has salido de esta interfaz';
  END IF;

  RETURN json_build_object(
    'message', 'Saliste correctamente',
    'data', row_to_json(v_updated)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Flat Views for Data API Queries
CREATE OR REPLACE VIEW public.v_gasto AS
SELECT g.*,
       (g.importes).importears AS importears,
       (g.importes).importeusd AS importeusd,
       (g.importes).importeuyu AS importeuyu,
       c.nombre AS categorianombre,
       smp.nombre AS submetodopagonombre,
       smp.metodo AS submetodopagometodo,
       c.idinterfazoperacion AS idinterfazoperacion
FROM public.gasto g
LEFT JOIN public.categoria c ON g.idcategoria = c.idcategoria
LEFT JOIN public.submetodopago smp ON g.idsubmetodopago = smp.idsubmetodopago;

CREATE OR REPLACE VIEW public.v_ingreso AS
SELECT i.*,
       (i.importes).importears AS importears,
       (i.importes).importeusd AS importeusd,
       (i.importes).importeuyu AS importeuyu
FROM public.ingreso i;

CREATE OR REPLACE VIEW public.v_ahorro AS
SELECT a.*,
       (a.importes).importears AS importears,
       (a.importes).importeusd AS importeusd,
       (a.importes).importeuyu AS importeuyu
FROM public.ahorro a;

CREATE OR REPLACE VIEW public.vistalimitegastosperiodo AS
SELECT 
  c.idcategoria,
  c.nombre AS categorianombre,
  c.idinterfazoperacion,
  c.estadolimite,
  c.importe AS importelimite,
  c.moneda AS monedalimite,
  c.periodoaplicacion,
  c.fechacreacionlimite,
  COALESCE(
    SUM(
      CASE 
        WHEN c.moneda = 'ARS'::tmoneda THEN COALESCE((g.importes).importears, g.importe)
        WHEN c.moneda = 'USD'::tmoneda THEN COALESCE((g.importes).importeusd, g.importe)
        WHEN c.moneda = 'UYU'::tmoneda THEN COALESCE((g.importes).importeuyu, g.importe)
        ELSE g.importe
      END
    ), 0
  ) AS importeutilizado
FROM public.categoria c
LEFT JOIN public.gasto g ON g.idcategoria = c.idcategoria AND g.estado = true AND (
  (c.periodoaplicacion = 'Semanal'::tperiodo AND g.fecha >= date_trunc('week', CURRENT_DATE)) OR
  (c.periodoaplicacion = 'Mensual'::tperiodo AND g.fecha >= date_trunc('month', CURRENT_DATE)) OR
  (c.periodoaplicacion = 'Trimestral'::tperiodo AND g.fecha >= date_trunc('quarter', CURRENT_DATE)) OR
  (c.periodoaplicacion = 'Anual'::tperiodo AND g.fecha >= date_trunc('year', CURRENT_DATE)) OR
  (c.periodoaplicacion IS NULL AND g.fecha >= date_trunc('month', CURRENT_DATE))
)
WHERE c.estado = true
GROUP BY c.idcategoria, c.nombre, c.idinterfazoperacion, c.estadolimite, c.importe, c.moneda, c.periodoaplicacion, c.fechacreacionlimite;


-- 12. RLS Policies Configuration (SECURITY DEFINER to prevent infinite recursion)

-- Helper function to safely get current user UUID without throwing missing schema errors
CREATE OR REPLACE FUNCTION public.current_user_id() RETURNS uuid AS $$
DECLARE
  v_uid uuid;
BEGIN
  -- 1. Try neon_auth.uid() if schema and function exist
  IF EXISTS (
    SELECT 1 FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'neon_auth' AND p.proname = 'uid'
  ) THEN
    BEGIN
      EXECUTE 'SELECT neon_auth.uid()' INTO v_uid;
      IF v_uid IS NOT NULL THEN
        RETURN v_uid;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Ignore and try fallbacks
    END;
  END IF;

  -- 2. Try auth.uid() if schema and function exist
  IF EXISTS (
    SELECT 1 FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'auth' AND p.proname = 'uid'
  ) THEN
    BEGIN
      EXECUTE 'SELECT auth.uid()' INTO v_uid;
      IF v_uid IS NOT NULL THEN
        RETURN v_uid;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Ignore and try fallbacks
    END;
  END IF;

  -- 3. Extract sub claim from PostgREST JWT claims
  RETURN NULLIF(
    COALESCE(
      current_setting('request.jwt.claim.sub', true),
      current_setting('request.jwt.claims', true)::json->>'sub',
      (current_setting('request.jwt.claims', true)::json->>'user_metadata')::json->>'id'
    ),
    ''
  )::uuid;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Security Definer functions to check membership without triggering RLS recursively
CREATE OR REPLACE FUNCTION public.es_miembro_interfaz(p_idinterfaz bigint, p_idusuario uuid)
RETURNS boolean AS $$
BEGIN
  IF p_idusuario IS NULL OR p_idinterfaz IS NULL THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.usuariointerfaz ui 
    WHERE ui.idinterfazoperacion = p_idinterfaz 
      AND ui.idusuario = p_idusuario 
      AND ui.fechasalida IS NULL
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.es_editor_interfaz(p_idinterfaz bigint, p_idusuario uuid)
RETURNS boolean AS $$
BEGIN
  IF p_idusuario IS NULL OR p_idinterfaz IS NULL THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.usuariointerfaz ui 
    WHERE ui.idinterfazoperacion = p_idinterfaz 
      AND ui.idusuario = p_idusuario 
      AND ui.rol IN ('Administrador', 'Invitado')
      AND ui.fechasalida IS NULL
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.es_admin_interfaz(p_idinterfaz bigint, p_idusuario uuid)
RETURNS boolean AS $$
BEGIN
  IF p_idusuario IS NULL OR p_idinterfaz IS NULL THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.usuariointerfaz ui 
    WHERE ui.idinterfazoperacion = p_idinterfaz 
      AND ui.idusuario = p_idusuario 
      AND ui.rol = 'Administrador'
      AND ui.fechasalida IS NULL
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Clear existing policies
DO $$ 
DECLARE 
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- A. "usuario"
CREATE POLICY select_usuario ON "usuario" FOR SELECT TO authenticated, anonymous, PUBLIC USING (true);
CREATE POLICY insert_usuario ON "usuario" FOR INSERT TO authenticated, anonymous, PUBLIC WITH CHECK (
  public.current_user_id() IS NULL OR idusuario = public.current_user_id()
);
CREATE POLICY update_usuario ON "usuario" FOR UPDATE TO authenticated, anonymous, PUBLIC USING (
  public.current_user_id() IS NULL OR idusuario = public.current_user_id()
) WITH CHECK (
  public.current_user_id() IS NULL OR idusuario = public.current_user_id()
);
CREATE POLICY delete_usuario ON "usuario" FOR DELETE TO authenticated, anonymous, PUBLIC USING (
  public.current_user_id() IS NULL OR idusuario = public.current_user_id()
);

-- B. "interfazoperacion"
CREATE POLICY select_interfazoperacion ON "interfazoperacion" FOR SELECT TO authenticated, anonymous, PUBLIC USING (
  public.current_user_id() IS NULL
  OR public.es_miembro_interfaz(idinterfazoperacion, public.current_user_id())
  OR linkinvitado IS NOT NULL 
  OR linkvisualizador IS NOT NULL
);
CREATE POLICY insert_interfazoperacion ON "interfazoperacion" FOR INSERT TO authenticated, anonymous, PUBLIC WITH CHECK (true);
CREATE POLICY update_interfazoperacion ON "interfazoperacion" FOR UPDATE TO authenticated, anonymous, PUBLIC USING (
  public.current_user_id() IS NULL
  OR public.es_admin_interfaz(idinterfazoperacion, public.current_user_id())
) WITH CHECK (
  public.current_user_id() IS NULL
  OR public.es_admin_interfaz(idinterfazoperacion, public.current_user_id())
);
CREATE POLICY delete_interfazoperacion ON "interfazoperacion" FOR DELETE TO authenticated, anonymous, PUBLIC USING (
  public.current_user_id() IS NULL
  OR public.es_admin_interfaz(idinterfazoperacion, public.current_user_id())
);

-- C. "usuariointerfaz"
CREATE POLICY select_usuariointerfaz ON "usuariointerfaz" FOR SELECT TO authenticated, anonymous, PUBLIC USING (
  public.current_user_id() IS NULL
  OR idusuario = public.current_user_id()
  OR public.es_miembro_interfaz(idinterfazoperacion, public.current_user_id())
);
CREATE POLICY insert_usuariointerfaz ON "usuariointerfaz" FOR INSERT TO authenticated, anonymous, PUBLIC WITH CHECK (
  public.current_user_id() IS NULL
  OR idusuario = public.current_user_id()
  OR public.es_editor_interfaz(idinterfazoperacion, public.current_user_id())
);
CREATE POLICY update_usuariointerfaz ON "usuariointerfaz" FOR UPDATE TO authenticated, anonymous, PUBLIC USING (
  public.current_user_id() IS NULL
  OR idusuario = public.current_user_id()
  OR public.es_admin_interfaz(idinterfazoperacion, public.current_user_id())
);
CREATE POLICY delete_usuariointerfaz ON "usuariointerfaz" FOR DELETE TO authenticated, anonymous, PUBLIC USING (
  public.current_user_id() IS NULL
  OR idusuario = public.current_user_id()
  OR public.es_admin_interfaz(idinterfazoperacion, public.current_user_id())
);

-- D. "ahorro"
CREATE POLICY select_ahorro ON "ahorro" FOR SELECT TO authenticated, anonymous, PUBLIC USING (
  public.current_user_id() IS NULL
  OR public.es_miembro_interfaz(idinterfazoperacion, public.current_user_id())
);
CREATE POLICY insert_ahorro ON "ahorro" FOR INSERT TO authenticated, anonymous, PUBLIC WITH CHECK (
  public.current_user_id() IS NULL
  OR public.es_editor_interfaz(idinterfazoperacion, public.current_user_id())
);
CREATE POLICY update_ahorro ON "ahorro" FOR UPDATE TO authenticated, anonymous, PUBLIC USING (
  public.current_user_id() IS NULL
  OR public.es_editor_interfaz(idinterfazoperacion, public.current_user_id())
);
CREATE POLICY delete_ahorro ON "ahorro" FOR DELETE TO authenticated, anonymous, PUBLIC USING (
  public.current_user_id() IS NULL
  OR public.es_editor_interfaz(idinterfazoperacion, public.current_user_id())
);

-- E. "categoria"
CREATE POLICY select_categoria ON "categoria" FOR SELECT TO authenticated, anonymous, PUBLIC USING (
  public.current_user_id() IS NULL
  OR public.es_miembro_interfaz(idinterfazoperacion, public.current_user_id())
);
CREATE POLICY insert_categoria ON "categoria" FOR INSERT TO authenticated, anonymous, PUBLIC WITH CHECK (
  public.current_user_id() IS NULL
  OR public.es_editor_interfaz(idinterfazoperacion, public.current_user_id())
);
CREATE POLICY update_categoria ON "categoria" FOR UPDATE TO authenticated, anonymous, PUBLIC USING (
  public.current_user_id() IS NULL
  OR public.es_editor_interfaz(idinterfazoperacion, public.current_user_id())
);
CREATE POLICY delete_categoria ON "categoria" FOR DELETE TO authenticated, anonymous, PUBLIC USING (
  public.current_user_id() IS NULL
  OR public.es_editor_interfaz(idinterfazoperacion, public.current_user_id())
);

-- F. "submetodopago"
CREATE POLICY select_submetodopago ON "submetodopago" FOR SELECT TO authenticated, anonymous, PUBLIC USING (
  public.current_user_id() IS NULL
  OR public.es_miembro_interfaz(idinterfazoperacion, public.current_user_id())
);
CREATE POLICY insert_submetodopago ON "submetodopago" FOR INSERT TO authenticated, anonymous, PUBLIC WITH CHECK (
  public.current_user_id() IS NULL
  OR public.es_editor_interfaz(idinterfazoperacion, public.current_user_id())
);
CREATE POLICY update_submetodopago ON "submetodopago" FOR UPDATE TO authenticated, anonymous, PUBLIC USING (
  public.current_user_id() IS NULL
  OR public.es_editor_interfaz(idinterfazoperacion, public.current_user_id())
);
CREATE POLICY delete_submetodopago ON "submetodopago" FOR DELETE TO authenticated, anonymous, PUBLIC USING (
  public.current_user_id() IS NULL
  OR public.es_editor_interfaz(idinterfazoperacion, public.current_user_id())
);

-- G. "ingreso"
CREATE POLICY select_ingreso ON "ingreso" FOR SELECT TO authenticated, anonymous, PUBLIC USING (
  public.current_user_id() IS NULL
  OR public.es_miembro_interfaz(idinterfazoperacion, public.current_user_id())
);
CREATE POLICY insert_ingreso ON "ingreso" FOR INSERT TO authenticated, anonymous, PUBLIC WITH CHECK (
  public.current_user_id() IS NULL
  OR public.es_editor_interfaz(idinterfazoperacion, public.current_user_id())
);
CREATE POLICY update_ingreso ON "ingreso" FOR UPDATE TO authenticated, anonymous, PUBLIC USING (
  public.current_user_id() IS NULL
  OR public.es_editor_interfaz(idinterfazoperacion, public.current_user_id())
);
CREATE POLICY delete_ingreso ON "ingreso" FOR DELETE TO authenticated, anonymous, PUBLIC USING (
  public.current_user_id() IS NULL
  OR public.es_editor_interfaz(idinterfazoperacion, public.current_user_id())
);

-- H. "gasto"
CREATE POLICY select_gasto ON "gasto" FOR SELECT TO authenticated, anonymous, PUBLIC USING (
  public.current_user_id() IS NULL
  OR responsablegasto = public.current_user_id()
  OR responsableingresargasto = public.current_user_id()
  OR public.es_miembro_interfaz((SELECT c.idinterfazoperacion FROM categoria c WHERE c.idcategoria = gasto.idcategoria), public.current_user_id())
);
CREATE POLICY insert_gasto ON "gasto" FOR INSERT TO authenticated, anonymous, PUBLIC WITH CHECK (
  public.current_user_id() IS NULL
  OR responsablegasto = public.current_user_id()
  OR responsableingresargasto = public.current_user_id()
  OR public.es_editor_interfaz((SELECT c.idinterfazoperacion FROM categoria c WHERE c.idcategoria = gasto.idcategoria), public.current_user_id())
);
CREATE POLICY update_gasto ON "gasto" FOR UPDATE TO authenticated, anonymous, PUBLIC USING (
  public.current_user_id() IS NULL
  OR responsablegasto = public.current_user_id()
  OR responsableingresargasto = public.current_user_id()
  OR public.es_editor_interfaz((SELECT c.idinterfazoperacion FROM categoria c WHERE c.idcategoria = gasto.idcategoria), public.current_user_id())
);
CREATE POLICY delete_gasto ON "gasto" FOR DELETE TO authenticated, anonymous, PUBLIC USING (
  public.current_user_id() IS NULL
  OR responsablegasto = public.current_user_id()
  OR responsableingresargasto = public.current_user_id()
  OR public.es_editor_interfaz((SELECT c.idinterfazoperacion FROM categoria c WHERE c.idcategoria = gasto.idcategoria), public.current_user_id())
);

-- I. "amistad"
CREATE POLICY select_amistad ON "amistad" FOR SELECT TO authenticated, anonymous, PUBLIC USING (public.current_user_id() IS NULL OR idremitente = public.current_user_id() OR iddestinatario = public.current_user_id());
CREATE POLICY insert_amistad ON "amistad" FOR INSERT TO authenticated, anonymous, PUBLIC WITH CHECK (public.current_user_id() IS NULL OR idremitente = public.current_user_id());
CREATE POLICY update_amistad ON "amistad" FOR UPDATE TO authenticated, anonymous, PUBLIC USING (public.current_user_id() IS NULL OR idremitente = public.current_user_id() OR iddestinatario = public.current_user_id());
CREATE POLICY delete_amistad ON "amistad" FOR DELETE TO authenticated, anonymous, PUBLIC USING (public.current_user_id() IS NULL OR idremitente = public.current_user_id() OR iddestinatario = public.current_user_id());

-- J. "notificacion"
CREATE POLICY select_notificacion ON "notificacion" FOR SELECT TO authenticated, anonymous, PUBLIC USING (public.current_user_id() IS NULL OR idreceptor = public.current_user_id() OR idemisor = public.current_user_id());
CREATE POLICY insert_notificacion ON "notificacion" FOR INSERT TO authenticated, anonymous, PUBLIC WITH CHECK (public.current_user_id() IS NULL OR idemisor = public.current_user_id());
CREATE POLICY update_notificacion ON "notificacion" FOR UPDATE TO authenticated, anonymous, PUBLIC USING (public.current_user_id() IS NULL OR idreceptor = public.current_user_id());
CREATE POLICY delete_notificacion ON "notificacion" FOR DELETE TO authenticated, anonymous, PUBLIC USING (public.current_user_id() IS NULL OR idreceptor = public.current_user_id() OR idemisor = public.current_user_id());

-- K. Tablas de Historial y Cambio
CREATE POLICY select_cambio ON "cambio" FOR SELECT TO authenticated, anonymous, PUBLIC USING (true);
CREATE POLICY select_historialahorro ON "historialahorro" FOR SELECT TO authenticated, anonymous, PUBLIC USING (true);
CREATE POLICY select_historialgasto ON "historialgasto" FOR SELECT TO authenticated, anonymous, PUBLIC USING (true);
CREATE POLICY select_historialingreso ON "historialingreso" FOR SELECT TO authenticated, anonymous, PUBLIC USING (true);
CREATE POLICY select_historiallimite ON "historiallimite" FOR SELECT TO authenticated, anonymous, PUBLIC USING (true);



-- Stored procedure to send interface invitation
CREATE OR REPLACE FUNCTION public.enviar_invitacion_interfaz(
  p_idemisor uuid,
  p_idreceptor uuid,
  p_idinterfaz bigint,
  p_rol trol DEFAULT 'Invitado'::trol
) RETURNS bigint AS $$
DECLARE
  v_emisor_nombre varchar;
  v_interfaz_nombre varchar;
  v_idnotificacion bigint;
BEGIN
  SELECT nombreusuario INTO v_emisor_nombre FROM public.usuario WHERE idusuario = p_idemisor;
  SELECT nombre INTO v_interfaz_nombre FROM public.interfazoperacion WHERE idinterfazoperacion = p_idinterfaz;

  INSERT INTO public.notificacion (
    idreceptor, idemisor, tipo, titulo, mensaje, idinterfazoperacion, rol_propuesto, estado, leido, fechacreacion
  ) VALUES (
    p_idreceptor,
    p_idemisor,
    'INVITACION_INTERFAZ',
    'Invitación a ' || COALESCE(v_interfaz_nombre, 'Interfaz de Operación'),
    COALESCE(v_emisor_nombre, 'Un usuario') || ' te ha invitado a unirte a "' || COALESCE(v_interfaz_nombre, 'Interfaz') || '" como ' || p_rol || '.',
    p_idinterfaz,
    p_rol,
    'Pendiente',
    false,
    CURRENT_TIMESTAMP
  ) RETURNING idnotificacion INTO v_idnotificacion;

  RETURN v_idnotificacion;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Stored procedure to respond to interface invitation
CREATE OR REPLACE FUNCTION public.responder_invitacion_interfaz(
  p_idnotificacion bigint,
  p_aceptar boolean
) RETURNS boolean AS $$
DECLARE
  v_notif record;
BEGIN
  SELECT * INTO v_notif FROM public.notificacion WHERE idnotificacion = p_idnotificacion;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Notificación no encontrada';
  END IF;

  IF p_aceptar THEN
    -- Insert or update usuariointerfaz
    INSERT INTO public.usuariointerfaz (idinterfazoperacion, idusuario, rol, fechaunion)
    VALUES (v_notif.idinterfazoperacion, v_notif.idreceptor, v_notif.rol_propuesto, CURRENT_DATE)
    ON CONFLICT (idinterfazoperacion, idusuario)
    DO UPDATE SET rol = EXCLUDED.rol, fechaunion = CURRENT_DATE;

    UPDATE public.notificacion
    SET estado = 'Aceptada', leido = true
    WHERE idnotificacion = p_idnotificacion;
  ELSE
    UPDATE public.notificacion
    SET estado = 'Rechazada', leido = true
    WHERE idnotificacion = p_idnotificacion;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


