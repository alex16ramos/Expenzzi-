# Expenzzi

Aplicación para la gestión colaborativa e inteligente de gastos, ingresos y ahorros compartidos en múltiples monedas (ARS, USD, UYU) con conversión de divisas automática e integración con Neon Auth y Neon Data API.

## Comandos Disponibles

### Iniciar Servidor de Desarrollo
Para iniciar la aplicación Next.js localmente (tanto frontend como backend/API):
```bash
pnpm dev
```

### Verificación de Tipado (TypeScript)
Para analizar y verificar que no existan errores de tipos en el código TypeScript de la aplicación:
```bash
pnpm tsc
```

### Validación de Código (Linter)
Para detectar problemas de formateo, errores de sintaxis y buenas prácticas de React:
```bash
pnpm lint
```

### Auditoría de Calidad y Rendimiento
Para diagnosticar y reportar problemas de arquitectura, performance, accesibilidad y seguridad en componentes React:
```bash
pnpx react-doctor --verbose
```

---

## Estructura del Proyecto

- `setup.sql`: Script de base de datos con triggers automáticos, vistas de Data API y RLS.
- `src/lib/auth.ts`: Inicialización y configuración de Neon Auth.
- `src/lib/neon.ts`: Clientes configurados para consultar Neon Data API.
- `src/proxy.ts`: Middleware de proxy para protección de rutas privadas.
- `src/app/page.tsx`: Landing page premium responsiva con formularios de acceso.
- `src/app/dashboard/page.tsx`: Dashboard de usuario para ingresar o unirse a interfaces.
- `src/app/interface/[id]/page.tsx`: Panel principal de operaciones de balance y movimientos.
- `src/app/api/cron/update-rates/route.ts`: Endpoint cron para actualización de cotizaciones.
