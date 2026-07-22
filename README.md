# Expenzzi

Aplicación para la gestión colaborativa e inteligente de gastos, ingresos y ahorros compartidos en múltiples monedas (ARS, USD, UYU) con conversión de divisas automática, Prisma ORM (con adaptador serverless de Neon), Neon Auth y Neon Data API.

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

### Generación de Cliente Prisma
Para regenerar los tipos e interfaces de TypeScript a partir del esquema de base de datos:
```bash
pnpm exec prisma generate
```

### Sincronización de Esquema de Base de Datos
Para aplicar cambios de modelos o sincronizar la estructura con Neon PostgreSQL:
```bash
pnpm exec prisma db push
```

### Auditoría de Calidad y Rendimiento
Para diagnosticar y reportar problemas de arquitectura, performance, accesibilidad y seguridad en componentes React:
```bash
pnpx react-doctor --verbose
```

---

## Estructura del Proyecto

- `prisma/schema.prisma`: Esquema de datos de Prisma ORM con enums, modelos y relaciones.
- `prisma.config.ts`: Configuración CLI de Prisma 7 conectada vía `DIRECT_URL`.
- `setup.sql`: Script DDL de PostgreSQL con triggers automáticos, vistas y RLS.
- `src/lib/db.ts`: Instancia singleton de Prisma Client con el adaptador `@prisma/adapter-neon`.
- `src/lib/auth.ts`: Inicialización y configuración de Neon Auth.
- `src/lib/neon.ts`: Clientes configurados para consultar Neon Data API.
- `@prisma/client`: Tipos y cliente nativos generados por Prisma.
- `src/middleware.ts`: Middleware para protección y enrutamiento de peticiones.
- `src/app/page.tsx`: Landing page responsiva con formularios de acceso.
- `src/app/dashboard/page.tsx`: Dashboard de usuario para ingresar o unirse a interfaces.
- `src/app/interface/[id]/page.tsx`: Panel principal de operaciones de balance y movimientos.
- `src/app/api/cron/update-rates/route.ts`: Endpoint cron para actualización de cotizaciones.
# 💸 Expenzzi — Gestión Financiera Personal y Colaborativa

**Expenzzi** es una aplicación moderna diseñada para ayudar a individuos, familias y grupos pequeños a organizar sus finanzas personales de forma clara, colaborativa y confiable.  
Pensada especialmente para usuarios de **Argentina y Uruguay**, Expenzzi permite gestionar ingresos, gastos y ahorros en múltiples monedas, con análisis detallados, reportes comparativos y control compartido entre varios usuarios.

> 🧾 *Convertí tus finanzas en algo simple, transparente y totalmente bajo control.*

---

## 🎯 Objetivo del Sistema

El objetivo principal de Expenzzi es ofrecer una plataforma **intuitiva y flexible** que permita:

- Registrar ingresos y gastos clasificados en categorías personalizadas.
- Visualizar la evolución financiera mediante reportes y gráficos comparativos.
- Compartir cuentas entre múltiples usuarios con permisos diferenciados.
- Organizar presupuestos con alertas inteligentes y límites por categoría.
- Establecer objetivos financieros con seguimiento periódico.
- Mantener un registro histórico confiable, incluyendo auditoría de cambios.
- Convertir automáticamente los montos entre **ARS**, **UYU** y **USD** usando cotizaciones actualizadas.

En conjunto, Expenzzi busca fomentar **hábitos responsables**, mejorar la transparencia en gastos compartidos y simplificar la administración diaria del dinero.

---

## ✨ Funcionalidades Principales

### 📊 Gestión Integral de Finanzas
- Registrar, modificar, consultar y eliminar **gastos**, **ingresos** y **ahorros**.
- Conversión automática entre ARS, UYU y USD.
- Auditoría de modificaciones (monto, fecha, usuario responsable).

### 🗂️ Categorías y Métodos de Pago
- Crear, modificar y eliminar categorías personalizadas.
- Categorías base incluidas (Alimentación, Vivienda, Transporte, etc.).
- Submétodos de pago personalizables (e.g., tarjeta X, billetera digital).
- Métodos de pago soportados: **crédito, débito, efectivo**.

### 👥 Colaboración Multiusuario
- Varias personas pueden acceder a la misma interfaz de operaciones.
- Roles disponibles: **Administrador**, **Visualizador**, **Invitado**.
- Gestión de permisos por interfaz y por usuario.

### 📈 Reportes Inteligentes
- Comparativos por período (mensual, anual, trimestral, semanal).
- Reportes por categoría o por tipo de operación.
- Alertas al superar límites establecidos por categoría.

### 🔔 Notificaciones y Alertas
- Balance actualizado de ingresos, egresos y ahorros.
- Aviso al superar límites de gasto.
- Cotizaciones actualizadas automáticamente.

### 🔐 Seguridad y Control
- Autenticación de usuarios (por correo).
- Usuarios de tipo desarrollador con permisos especiales.
- Historial de cambios e integridad de datos.

## 🛠️ Requerimientos No Funcionales

- Disponible para **Android**, **iOS** y navegadores web.
- Desarrollado en **React Native** (mobile) + Web responsive.
- Base de datos **PostgreSQL**.
- Seguridad mediante autenticación por correo.
- Soporte nativo para: ARS, UYU, USD.
- Formato numérico estándar: **$0.000,00** (puntos para miles, coma para decimales).
- Roles del sistema:  
  - **Desarrollador** (acceso total)  
  - **Administrador**  
  - **Visualizador**  
  - **Invitado**  

---

## 📘 Licencia
MIT — Libre para usar, modificar y mejorar.

---

## 👤 Autores
Proyecto desarrollado para la materia **Seminario Integrador / Proyecto Final / 2025**,  
Universidad Tecnológica Nacional (UTN).

