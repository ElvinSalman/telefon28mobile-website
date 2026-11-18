-- Revert the app first if needed. Preserve remembered states and all existing data.
begin;
revoke execute on function public.shop_product_action(text,text,timestamptz) from authenticated;
revoke delete on public.products from authenticated;
commit;
