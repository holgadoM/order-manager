-- Default privileges grant ALL, including TRUNCATE, which bypasses RLS.
revoke truncate, references, trigger, maintain on table
  public.products,
  public.customers,
  public.orders,
  public.order_items
from authenticated;
