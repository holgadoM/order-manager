# order-manager — roadmap

Gestor de pedidos para un emprendimiento pequeño: una persona administra productos, clientes y pedidos, y mueve cada pedido por estados simples.

El orquestador ejecuta **una tarea a la vez**. Develop implementa. Testing responde `APPROVED` o `REJECTED`. La siguiente tarea no empieza hasta que la actual esté `aprobada`.

Estado de cada tarea: `pendiente` | `en curso` | `rechazada` | `aprobada`.

T1 está en curso. T0 está aprobada. La siguiente no empieza hasta que T1 esté aprobada.

## Arquitectura

Objetivo: poder crecer a varios usuarios del mismo negocio más adelante, sin montar ahora un framework interno.

### Decisiones

- **Next.js 16 (App Router) + TypeScript estricto + Tailwind CSS 4**, que ya están en el repo. `cacheComponents` y `partialPrefetching` permanecen activos.
- **Supabase** para Postgres, Auth y autorización. Cliente `@supabase/ssr`. Sin ORM, sin Prisma y sin capa de repositorios genéricos. Develop y Testing usan el MCP `supabase` de Cursor para documentación, esquema y comprobaciones. Las migraciones se guardan en el repo y solo se aplican al proyecto de abajo.

### Proyecto Supabase

El único proyecto permitido es `order-manager`.

- Referencia: `kbanmxsjernnngpfjked`
- URL: `https://kbanmxsjernnngpfjked.supabase.co`
- Región: `eu-west-1`
- Postgres 17, estado `ACTIVE_HEALTHY`
- El esquema `public` no tiene tablas todavía

`mtasks` y `dulces-tierra` no se usan. La clave publicable va en `.env` local cuando se ejecute T0; no se escribe en este archivo.
- **Dueño único por fila** (`owner_id = auth.uid()`). No hay tabla de organizaciones ni roles en esta versión. El día que haga falta un equipo, se añade `organization_id` y se ajustan las políticas; la UI no depende de un motor de permisos.
- **Lecturas en Server Components. Escrituras en Server Actions.** El servidor sigue siendo la fuente de datos. No hace falta caché de cliente.
- **shadcn/ui** es la interfaz. Los primitivos viven en `components/ui` y las pantallas solo los componen. Nada de otra librería visual ni de un design system paralelo.
- **TanStack Table** (`@tanstack/react-table`) en los listados de productos, clientes y pedidos. shadcn no trae tabla con columnas, orden y estado vacío; Table se apoya en esa librería. Ahí termina TanStack.
- **Sin TanStack Query ni TanStack Form.** Las lecturas no necesitan caché de cliente y los formularios se validan en la Server Action. Una línea de pedido que se añade en el navegador usa estado local, no un gestor de formularios.
- **Dinero en céntimos enteros** (`integer`). El precio del ítem se copia al crear el pedido para que un cambio posterior del producto no reescriba pedidos viejos.
- **Estado del pedido** como texto con `check` en base de datos: `pendiente`, `confirmado`, `entregado`, `cancelado`. La transición permitida vive en una función pequeña testeable, no en una librería de máquinas de estados.
- **Validación con Zod** en el límite de cada Server Action, introducida en la primera tarea que escriba datos.
- **RLS activa en todas las tablas expuestas.** Políticas `TO authenticated` con predicado de dueño. `UPDATE` incluye `USING` y `WITH CHECK`. Los ítems se autorizan a través del pedido padre.
- **Sesión** renovada en el límite de la petición, en el archivo que documente Next.js 16 instalado (`middleware.ts` o `proxy.ts`).

### Tests

Develop crea tests en la misma tarea que toque un componente crítico. Testing los ejecuta. `APPROVED` exige que pasen. Un fallo es `REJECTED` y el orquestador se lo reenvía a Develop antes de seguir.

Son críticos:

- la conversión entre euros y céntimos, el total del pedido y la transición de estado;
- los esquemas Zod de productos, clientes y pedidos;
- los componentes con comportamiento propio: formularios de alta y edición, líneas del pedido y el control que cambia el estado.

No son críticos los primitivos de shadcn (`components/ui`) ni una página que solo compone datos ya testeados.

La primera tarea que introduzca uno de esos componentes deja `npm test` funcionando. El runner es Vitest.

Los archivos `*.spec.ts` y `*.spec.tsx` no se colocan junto al código de la aplicación. Van en una carpeta `test` dentro de la raíz de ese código (`lib`, `components` o `app`) y, a partir de ahí, repiten la misma jerarquía:

```text
lib/
  supabase/
    client.ts
  utils.ts
  test/
    supabase/
      client.spec.ts
    utils.spec.ts
components/
  orders/
    order-form.tsx
  test/
    orders/
      order-form.spec.tsx
```

Un `*.spec.ts` al lado de `client.ts`, o un archivo de aplicación dentro de `test/`, no cumple la regla.

### Forma del código

```text
app/
  login/page.tsx
  (panel)/
    layout.tsx
    page.tsx                  # resumen
    products/page.tsx
    customers/page.tsx
    orders/page.tsx
    orders/new/page.tsx
    orders/[id]/page.tsx
components/
  ui/                         # primitivos de shadcn
  products/                   # composición de una pantalla
  customers/
  orders/
lib/
  supabase/client.ts
  supabase/server.ts
  validation/
  products.ts
  customers.ts
  orders.ts                   # consultas, totales y transiciones
supabase/migrations/
types/database.ts             # tipos generados o escritos a mano, alineados al SQL
```

`lib/*.ts` contiene las reglas (total del pedido, transición de estado). Las páginas componen datos y llaman a esas funciones. No hay carpeta `domain/`, `use-cases/` ni `infrastructure/`.

### Datos

- `products`: id, owner_id, name, price_cents, active, timestamps
- `customers`: id, owner_id, name, phone, notes, timestamps
- `orders`: id, owner_id, customer_id, status, notes, timestamps
- `order_items`: id, order_id, product_id, product_name, quantity, unit_price_cents

`product_name` y `unit_price_cents` quedan fijados en el ítem. El total del pedido se calcula al leer o al guardar a partir de los ítems; no se edita a mano.

### Fuera de alcance

Pagos, facturas, PDF, inventario, impuestos, envíos, notificaciones, tiempo real, multiempresa, roles, panel de administración de Supabase y app móvil.

## Tareas

### T0 — Cimientos del proyecto

Estado: `aprobada`

Último informe: [Testing T0](4eb32b4e-5e8b-483a-b987-7691f820ec5f) — `APPROVED`.

Preparar el esqueleto sin pantallas de negocio.

Criterios de aceptación:

- Existen clientes Supabase de servidor y de navegador, y el refresco de sesión en el archivo que corresponda a Next.js 16.
- `.env.example` documenta solo la URL y la clave publicable. No hay secretos commiteados.
- La ruta `/` sigue compilando.
- `npm run lint` y `npx tsc --noEmit` terminan sin errores.
- shadcn/ui queda inicializado para Tailwind CSS 4 (`components.json`, `lib/utils.ts`) y `@tanstack/react-table` está instalado. No se instalan `@tanstack/react-query` ni `@tanstack/react-form`.
- No se añade ORM ni otro cliente de datos distinto de `@supabase/supabase-js` y `@supabase/ssr`.

### T1 — Esquema y acceso por dueño

Estado: `en curso`

Migración SQL de las cuatro tablas, con RLS y políticas de dueño.

Criterios de aceptación:

- Las cuatro tablas existen con las columnas de la sección Datos.
- RLS está activa y un usuario autenticado solo lee y escribe sus filas.
- Un ítem de pedido solo es accesible si el pedido pertenece a ese usuario.
- Precios en céntimos y estado del pedido restringido por `check`.
- La migración es un archivo en `supabase/migrations/`, no SQL suelto solo en el chat.

### T2 — Acceso con correo y contraseña

Estado: `pendiente`

Alta e inicio de sesión con Supabase Auth. El panel exige sesión.

Criterios de aceptación:

- Se puede crear cuenta e iniciar sesión con correo y contraseña.
- Sin sesión, `/`, productos, clientes y pedidos redirigen a `/login`.
- Con sesión, se ve un panel vacío con el correo y un cierre de sesión que vuelve a `/login`. El panel usa componentes de shadcn.
- La sesión sobrevive a una recarga.
- No se usa `service_role` en el cliente.

### T3 — Productos

Estado: `pendiente`

Alta, listado, edición y activación de productos del usuario autenticado.

Criterios de aceptación:

- Crear un producto con nombre y precio mayor que cero, expresado en euros en el formulario y guardado en céntimos.
- Listar solo los productos del usuario en una tabla shadcn montada con TanStack Table, con estado vacío cuando no hay ninguno.
- Editar nombre, precio y si está activo.
- Un precio inválido o un nombre vacío muestra error y no escribe en la base.
- Errores de red o de Supabase se muestran sin tumbar la página.

### T4 — Clientes

Estado: `pendiente`

Alta, listado y edición de clientes.

Criterios de aceptación:

- Crear y editar cliente con nombre obligatorio, teléfono y notas opcionales.
- Listar solo los clientes del usuario en una tabla shadcn montada con TanStack Table, con estado vacío.
- Nombre vacío no se guarda y el formulario explica el error.

### T5 — Crear un pedido

Estado: `pendiente`

Pedido con cliente, ítems y nota.

Criterios de aceptación:

- Elegir un cliente propio y al menos un producto activo propio, con cantidad entera mayor que cero.
- El total mostrado coincide con la suma de cantidad × precio unitario capturado.
- Al guardar, el ítem conserva nombre y precio aunque después cambie el producto.
- No se puede guardar sin cliente, sin ítems o con un producto inactivo o ajeno.
- Hay una función pura del total cubierta por tests.

### T6 — Listar pedidos y cambiar estado

Estado: `pendiente`

Listado filtrable y ficha con transición de estado.

Criterios de aceptación:

- La lista muestra cliente, estado, total y fecha, solo del usuario, en una tabla shadcn montada con TanStack Table.
- Se puede filtrar por estado, incluido el caso sin resultados.
- La ficha muestra ítems, cantidades, precios y total.
- Las transiciones permitidas son: pendiente → confirmado, confirmado → entregado, y pendiente o confirmado → cancelado. Entregado y cancelado no cambian.
- La regla de transición está testeada fuera de la UI.
- Una transición inválida no se persiste y se explica en pantalla.

### T7 — Resumen

Estado: `pendiente`

Página inicial del panel con conteos.

Criterios de aceptación:

- Muestra cuántos pedidos hay en pendiente, confirmado y entregado, y el número de productos activos.
- Los conteos son solo del usuario autenticado.
- Si no hay datos, los conteos son cero y la página sigue siendo útil.
