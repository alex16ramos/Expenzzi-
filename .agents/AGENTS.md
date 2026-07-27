# Rules and Project Guidelines for Agents (AGENTS.md)

Este archivo contiene las reglas específicas del espacio de trabajo y directrices técnicas para que los asistentes de desarrollo IA puedan interactuar con la aplicación de forma consistente.

## Directrices Técnicas

### 1. Gestión de Paquetes
* **Gestor de Paquetes Requerido**: Utilizar siempre `pnpm` para instalar dependencias, ejecutar scripts o correr herramientas de diagnóstico. No utilizar `npm` ni `yarn`.

### 2. Comandos Clave del Proyecto
* **Levantar Entorno Local**: `pnpm dev`
* **Chequeo de Tipos**: `pnpm tsc` (debe correrse antes de entregar cambios para verificar que no haya errores estáticos).
* **Validación de Código**: `pnpm lint` (verifica reglas de React y formateo).
* **Auditoría de Componentes**: `pnpx react-doctor --verbose` (informa sobre arquitectura, accesibilidad y performance).
* **Generación de Cliente Prisma**: `pnpm exec prisma generate` (genera el cliente tipado en `@prisma/client`).
* **Sincronización de Esquema**: `pnpm exec prisma db push` (sincroniza el esquema con Neon usando `DIRECT_URL`).

### 3. Backend, Neon y Prisma ORM
* **ORM y Acceso a Objetos**: Usar la instancia singleton de Prisma Client exportada en `src/lib/db.ts` (`import { prisma } from '@/lib/db'`) para consultas fuertemente tipadas sobre los modelos de la base de datos.
* **Cliente Neon PostgREST**: Para consultas con Row-Level Security (RLS) en PostgREST, usar el cliente configurado en `src/lib/neon.ts` (`getDbClient()`).
* **Configuración de Prisma 7**: El esquema reside en `prisma/schema.prisma` y la configuración de CLI reside en `prisma.config.ts`. El cliente generado reside en `@prisma/client`.
* **Automatización en BD**: Los cálculos de conversión de divisas (`timportes`) y auditoría (`historialgasto`, `historialingreso`, etc.) se manejan automáticamente por los triggers definidos en `setup.sql`. No duplicar lógica en el servidor Next.js.

