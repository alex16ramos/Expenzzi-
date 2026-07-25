import { prisma } from '../src/lib/db';

async function run() {
  console.log('Connecting to Prisma DB...');

  await prisma.$executeRawUnsafe(`
    ALTER TABLE public.usuario ADD COLUMN IF NOT EXISTS temapreferido varchar(20) DEFAULT 'system';
  `);
  console.log('✅ temapreferido column verified');

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.notificacion (
      idnotificacion bigserial PRIMARY KEY,
      idreceptor uuid NOT NULL REFERENCES public.usuario(idusuario) ON DELETE CASCADE,
      idemisor uuid NOT NULL REFERENCES public.usuario(idusuario) ON DELETE CASCADE,
      tipo varchar(50) DEFAULT 'INVITACION_INTERFAZ' NOT NULL,
      titulo varchar(100) NOT NULL,
      mensaje text,
      idinterfazoperacion bigint REFERENCES public.interfazoperacion(idinterfazoperacion) ON DELETE CASCADE,
      rol_propuesto trol DEFAULT 'Invitado'::trol,
      estado varchar(20) DEFAULT 'Pendiente' NOT NULL,
      leido boolean DEFAULT false NOT NULL,
      fechacreacion timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
  `);
  console.log('✅ notificacion table verified');

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.amistad (
      idamistad bigserial PRIMARY KEY,
      idremitente uuid NOT NULL REFERENCES public.usuario(idusuario) ON DELETE CASCADE,
      iddestinatario uuid NOT NULL REFERENCES public.usuario(idusuario) ON DELETE CASCADE,
      estado testadoamistad DEFAULT 'Pendiente'::testadoamistad NOT NULL,
      fechacreacion date DEFAULT CURRENT_DATE NOT NULL,
      CONSTRAINT amistad_remitente_destinatario_key UNIQUE(idremitente, iddestinatario)
    );
  `);
  console.log('✅ amistad table verified');

  console.log('Migration Completed Successfully!');
}

run()
  .catch((err) => {
    console.error('Migration Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
