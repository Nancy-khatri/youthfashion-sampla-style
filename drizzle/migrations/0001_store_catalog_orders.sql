revoke execute on function public.claim_store_owner() from authenticated;
drop policy if exists "Owner inserts roles" on public.user_roles;
create policy "Owner inserts roles" on public.user_roles for insert to authenticated with check (public.has_role(auth.uid(),'owner') and role <> 'owner');

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "Categories public read" on public.categories for select to anon, authenticated using (true);
create policy "Staff manage categories" on public.categories for all to authenticated using (public.is_store_admin(auth.uid())) with check (public.is_store_admin(auth.uid()));

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  category text not null,
  subcategory text,
  brand text not null default 'Youth Fashion',
  price int not null check (price > 0),
  discount_price int check (discount_price is null or (discount_price > 0 and discount_price < price)),
  images text[] not null default '{}',
  tags text[] not null default '{}',
  featured boolean not null default false,
  new_arrival boolean not null default false,
  active boolean not null default true,
  low_stock_threshold int not null default 3,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "Active products public read" on public.products for select to anon, authenticated using (active or public.is_store_admin(auth.uid()));
create policy "Staff insert products" on public.products for insert to authenticated with check (public.is_store_admin(auth.uid()));
create policy "Staff update products" on public.products for update to authenticated using (public.is_store_admin(auth.uid())) with check (public.is_store_admin(auth.uid()));
create policy "Staff delete products" on public.products for delete to authenticated using (public.is_store_admin(auth.uid()));

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null,
  color text not null,
  sku text not null unique,
  stock int not null default 0 check (stock >= 0),
  created_at timestamptz not null default now(),
  unique (product_id, size, color)
);
create index on public.product_variants(product_id);
grant select on public.product_variants to anon, authenticated;
grant insert, update, delete on public.product_variants to authenticated;
grant all on public.product_variants to service_role;
alter table public.product_variants enable row level security;
create policy "Variants public read" on public.product_variants for select to anon, authenticated using (exists (select 1 from public.products p where p.id = product_id and (p.active or public.is_store_admin(auth.uid()))));
create policy "Staff manage variants" on public.product_variants for all to authenticated using (public.is_store_admin(auth.uid())) with check (public.is_store_admin(auth.uid()));

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  full_name text not null,
  phone text not null,
  house text not null,
  street text not null,
  city text not null,
  state text not null,
  pin text not null,
  instructions text,
  lat double precision,
  lng double precision,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.addresses(user_id);
grant select, insert, update, delete on public.addresses to authenticated;
grant all on public.addresses to service_role;
alter table public.addresses enable row level security;
create policy "Own addresses" on public.addresses for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create type public.order_status as enum ('pending_payment','paid','processing','shipped','delivered','cancelled','payment_failed','needs_attention');
create type public.payment_status as enum ('created','paid','failed');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity,
  user_id uuid not null,
  status public.order_status not null default 'pending_payment',
  payment_status public.payment_status not null default 'created',
  subtotal int not null,
  discount_total int not null default 0,
  total int not null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  address jsonb not null,
  lat double precision,
  lng double precision,
  razorpay_order_id text unique,
  razorpay_payment_id text unique,
  paid_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.orders(user_id);
grant select, update on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "Own or staff read orders" on public.orders for select to authenticated using (auth.uid() = user_id or public.is_store_admin(auth.uid()));
create policy "Staff update orders" on public.orders for update to authenticated using (public.is_store_admin(auth.uid())) with check (public.is_store_admin(auth.uid()));

create or replace function public.guard_order_update() returns trigger language plpgsql set search_path = public as $$
begin
  if current_user = 'authenticated' then
    if new.payment_status is distinct from old.payment_status or new.total is distinct from old.total
       or new.razorpay_payment_id is distinct from old.razorpay_payment_id or new.razorpay_order_id is distinct from old.razorpay_order_id
       or new.paid_at is distinct from old.paid_at or new.user_id is distinct from old.user_id then
      raise exception 'Payment fields cannot be changed';
    end if;
    if new.status in ('paid','pending_payment','payment_failed') and new.status is distinct from old.status then
      raise exception 'Invalid status change';
    end if;
    if old.payment_status <> 'paid' and new.status is distinct from old.status and new.status <> 'cancelled' then
      raise exception 'Unpaid orders cannot be fulfilled';
    end if;
  end if;
  new.updated_at = now();
  return new;
end $$;
create trigger orders_guard before update on public.orders for each row execute function public.guard_order_update();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid,
  variant_id uuid,
  name text not null,
  image text,
  size text not null,
  color text not null,
  sku text,
  unit_price int not null,
  original_price int not null,
  quantity int not null check (quantity > 0)
);
create index on public.order_items(order_id);
grant select on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "Own or staff read items" on public.order_items for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_store_admin(auth.uid()))));

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  event_type text not null,
  razorpay_order_id text,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
grant all on public.payment_events to service_role;
alter table public.payment_events enable row level security;

create or replace function public.finalize_paid_order(_order_id uuid, _payment_id text)
returns text language plpgsql security definer set search_path = public as $$
declare o public.orders; it record; short boolean := false;
begin
  select * into o from public.orders where id = _order_id for update;
  if not found then return 'not_found'; end if;
  if o.payment_status = 'paid' then return 'already_paid'; end if;
  for it in select variant_id, quantity from public.order_items where order_id = _order_id loop
    update public.product_variants set stock = stock - it.quantity where id = it.variant_id and stock >= it.quantity;
    if not found then short := true; end if;
  end loop;
  update public.orders set payment_status = 'paid', razorpay_payment_id = _payment_id, paid_at = now(),
    status = case when short then 'needs_attention'::public.order_status else 'paid'::public.order_status end,
    note = case when short then 'Paid but some items were out of stock — contact customer / refund.' else note end
  where id = _order_id;
  return case when short then 'paid_stock_issue' else 'paid' end;
end $$;
revoke execute on function public.finalize_paid_order(uuid, text) from public, anon, authenticated;
grant execute on function public.finalize_paid_order(uuid, text) to service_role;

create policy "Product images read" on storage.objects for select to anon, authenticated using (bucket_id = 'product-images');
create policy "Staff upload product images" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and public.is_store_admin(auth.uid()));
create policy "Staff delete product images" on storage.objects for delete to authenticated using (bucket_id = 'product-images' and public.is_store_admin(auth.uid()));