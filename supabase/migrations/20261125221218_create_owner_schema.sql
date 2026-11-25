-- T1: tablas del dueño. El total del pedido no se guarda; se calcula desde order_items.

create table public.products (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  price_cents integer not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_name_not_blank check (char_length(btrim(name)) > 0),
  constraint products_price_cents_positive check (price_cents > 0)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_name_not_blank check (char_length(btrim(name)) > 0)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete restrict,
  status text not null default 'pendiente',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_status_check check (
    status in ('pendiente', 'confirmado', 'entregado', 'cancelado')
  )
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  product_name text not null,
  quantity integer not null,
  unit_price_cents integer not null,
  constraint order_items_product_name_not_blank check (char_length(btrim(product_name)) > 0),
  constraint order_items_quantity_positive check (quantity > 0),
  constraint order_items_unit_price_cents_positive check (unit_price_cents > 0)
);

create index products_owner_id_idx on public.products (owner_id);
create index customers_owner_id_idx on public.customers (owner_id);
create index orders_owner_id_idx on public.orders (owner_id);
create index orders_customer_id_idx on public.orders (customer_id);
create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_product_id_idx on public.order_items (product_id);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon;
grant execute on function public.set_updated_at() to authenticated, service_role;

create trigger products_set_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

create trigger customers_set_updated_at
before update on public.customers
for each row
execute function public.set_updated_at();

create trigger orders_set_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();

alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

revoke all on table public.products from public, anon;
revoke all on table public.customers from public, anon;
revoke all on table public.orders from public, anon;
revoke all on table public.order_items from public, anon;

grant select, insert, update, delete on table public.products to authenticated, service_role;
grant select, insert, update, delete on table public.customers to authenticated, service_role;
grant select, insert, update, delete on table public.orders to authenticated, service_role;
grant select, insert, update, delete on table public.order_items to authenticated, service_role;

create policy products_select_own
on public.products
for select
to authenticated
using (owner_id = (select auth.uid()));

create policy products_insert_own
on public.products
for insert
to authenticated
with check (owner_id = (select auth.uid()));

create policy products_update_own
on public.products
for update
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy products_delete_own
on public.products
for delete
to authenticated
using (owner_id = (select auth.uid()));

create policy customers_select_own
on public.customers
for select
to authenticated
using (owner_id = (select auth.uid()));

create policy customers_insert_own
on public.customers
for insert
to authenticated
with check (owner_id = (select auth.uid()));

create policy customers_update_own
on public.customers
for update
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy customers_delete_own
on public.customers
for delete
to authenticated
using (owner_id = (select auth.uid()));

create policy orders_select_own
on public.orders
for select
to authenticated
using (owner_id = (select auth.uid()));

create policy orders_insert_own
on public.orders
for insert
to authenticated
with check (
  owner_id = (select auth.uid())
  and exists (
    select 1
    from public.customers
    where customers.id = customer_id
      and customers.owner_id = (select auth.uid())
  )
);

create policy orders_update_own
on public.orders
for update
to authenticated
using (owner_id = (select auth.uid()))
with check (
  owner_id = (select auth.uid())
  and exists (
    select 1
    from public.customers
    where customers.id = customer_id
      and customers.owner_id = (select auth.uid())
  )
);

create policy orders_delete_own
on public.orders
for delete
to authenticated
using (owner_id = (select auth.uid()));

create policy order_items_select_own
on public.order_items
for select
to authenticated
using (
  exists (
    select 1
    from public.orders
    where orders.id = order_id
      and orders.owner_id = (select auth.uid())
  )
);

create policy order_items_insert_own
on public.order_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.orders
    where orders.id = order_id
      and orders.owner_id = (select auth.uid())
  )
  and exists (
    select 1
    from public.products
    where products.id = product_id
      and products.owner_id = (select auth.uid())
  )
);

create policy order_items_update_own
on public.order_items
for update
to authenticated
using (
  exists (
    select 1
    from public.orders
    where orders.id = order_id
      and orders.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.orders
    where orders.id = order_id
      and orders.owner_id = (select auth.uid())
  )
  and exists (
    select 1
    from public.products
    where products.id = product_id
      and products.owner_id = (select auth.uid())
  )
);

create policy order_items_delete_own
on public.order_items
for delete
to authenticated
using (
  exists (
    select 1
    from public.orders
    where orders.id = order_id
      and orders.owner_id = (select auth.uid())
  )
);
