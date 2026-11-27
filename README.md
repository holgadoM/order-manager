# Order Manager

Gestor de pedidos para pequeños emprendimientos. Una persona administra su catálogo de productos, su lista de clientes y sus pedidos, moviendo cada uno por un flujo de estados simple: **pendiente → confirmado → entregado** (o cancelado en cualquier punto intermedio).

Pensado para funcionar solo, con la posibilidad de crecer a varios usuarios del mismo negocio sin reescribir la base.

---

## Funcionalidades

- **Autenticación** con correo y contraseña (Supabase Auth). Sin sesión, todo redirige al login.
- **Productos** — alta, edición, activación/desactivación y listado. Precio ingresado en euros, guardado en céntimos.
- **Clientes** — alta, edición y listado con nombre obligatorio, teléfono y notas opcionales.
- **Pedidos** — creación con cliente, líneas de producto y nota; listado filtrable por estado; ficha con detalle de ítems y total calculado.
- **Resumen** — panel de inicio con conteos de pedidos por estado y productos activos.
- **Transición de estado** validada en el servidor: solo se permiten las combinaciones definidas; las inválidas se rechazan con mensaje.

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) · App Router · TypeScript estricto |
| Estilos | [Tailwind CSS 4](https://tailwindcss.com) |
| Componentes UI | [shadcn/ui](https://ui.shadcn.com) (`components/ui`) |
| Tablas | [TanStack Table v9](https://tanstack.com/table) |
| Backend / Auth | [Supabase](https://supabase.com) · Postgres 17 · RLS por dueño |
| Cliente Supabase | `@supabase/supabase-js` + `@supabase/ssr` |
| Validación | [Zod 4](https://zod.dev) en el límite de cada Server Action |
| Iconos | [Lucide React](https://lucide.dev) |
| Tests | [Vitest](https://vitest.dev) + Testing Library |

> Sin ORM, sin Prisma, sin TanStack Query ni TanStack Form. Las lecturas van en Server Components; las escrituras en Server Actions.

---

## Estructura del proyecto

```
app/
  login/page.tsx
  (panel)/
    layout.tsx
    page.tsx                 # Resumen / panel de inicio
    products/page.tsx
    customers/page.tsx
    orders/page.tsx
    orders/new/page.tsx
    orders/[id]/page.tsx
components/
  ui/                        # Primitivos de shadcn (no tocar a mano)
  products/                  # Composición de pantalla de productos
  customers/                 # Composición de pantalla de clientes
  orders/                    # Composición de pantalla de pedidos
  summary/                   # Tarjetas del panel de inicio
  test/                      # Specs por sección (Vitest)
lib/
  supabase/
    client.ts                # Cliente de navegador
    server.ts                # Cliente de servidor
  validation/                # Esquemas Zod compartidos
  products.ts                # Consultas y lógica de productos
  customers.ts               # Consultas y lógica de clientes
  orders.ts                  # Consultas, totales y transiciones de estado
supabase/
  migrations/                # SQL versionado (aplicar con Supabase CLI)
types/
  database.ts                # Tipos alineados al esquema SQL
proxy.ts                     # Refresco de sesión (middleware de Next.js 16)
```

---

## Variables de entorno

Copia `.env.example` a `.env.local` y rellena los valores con los de tu proyecto Supabase:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://<tu-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<tu-clave-publicable>
```

> Solo se necesitan estas dos variables. No uses `service_role` ni ningún secreto en el cliente.

---

## Requisitos previos

- **Node.js 20+** (recomendado: instala con [nvm](https://github.com/nvm-sh/nvm) o [fnm](https://github.com/Schniz/fnm))
- **npm** (incluido con Node)
- Una cuenta en [Supabase](https://supabase.com) con un proyecto activo

---

## Levantar el proyecto localmente

### 1. Clonar el repositorio

```bash
git clone https://github.com/<tu-usuario>/order-manager.git
cd order-manager
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env.local
# Edita .env.local con la URL y la clave publicable de tu proyecto Supabase
```

### 4. Aplicar las migraciones de base de datos

Necesitas la [Supabase CLI](https://supabase.com/docs/guides/cli) instalada:

```bash
# Autenticarse (una sola vez)
supabase login

# Vincular con tu proyecto (usa la referencia de tu proyecto)
supabase link --project-ref <tu-ref>

# Aplicar migraciones
supabase db push
```

Esto crea las tablas `products`, `customers`, `orders` y `order_items` con RLS y políticas de dueño.

### 5. Crear un usuario de prueba

Desde el panel de Supabase → **Authentication → Users → Add user**, crea un usuario con correo y contraseña. También puedes registrarte directamente desde `/login` en la app.

### 6. Arrancar el servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador.

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con hot reload |
| `npm run build` | Compilación de producción |
| `npm run start` | Servidor de producción (requiere build previo) |
| `npm run lint` | Análisis estático con ESLint |
| `npx tsc --noEmit` | Verificación de tipos TypeScript |
| `npm test` | Ejecuta la suite de tests con Vitest |

---

## Tests

Los specs viven en carpetas `test/` dentro de cada área (`components/test/`, `lib/test/`), siguiendo la misma jerarquía que el código:

```
components/
  test/
    customers/
      customers-table.spec.tsx
      customer-form.spec.tsx
    orders/
      orders-table.spec.tsx
    products/
      products-table.spec.tsx
      product-form.spec.tsx
    summary/
      panel-summary.spec.tsx
lib/
  test/
    orders.spec.ts   # Totales y transiciones de estado
```

```bash
npm test
```

Son críticos (y deben pasar para aprobar cualquier cambio): la conversión euros/céntimos, el total del pedido, la transición de estado, los esquemas Zod y los componentes con comportamiento propio.
