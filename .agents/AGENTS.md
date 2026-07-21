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

### 3. Backend e Integración con Neon
* **Acceso a Datos**: Usar el cliente Neon PostgREST de `@neondatabase/postgrest-js` expuesto en `src/lib/neon.ts`.
* **Row-Level Security (RLS)**: Toda consulta sensible debe realizarse usando el cliente autenticado que inyecta el token de sesión del usuario en la cabecera.
* **Automatización en BD**: Los cálculos de conversión de divisas (`timportes`) y auditoría de auditorías (`historialgasto`, `historialingreso`, etc.) se manejan automáticamente por los triggers definidos en `setup.sql`. No duplicar lógica en el servidor Next.js.
