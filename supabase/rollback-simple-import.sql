-- Operational rollback: disable only the new import/brand-resolution entry points.
-- Revert the application to the preserved Git baseline if needed.
-- Keep import_key and all data so retry/idempotency information is not destroyed.
begin;
revoke execute on function public.shop_import_products(jsonb) from authenticated;
revoke execute on function public.shop_resolve_brand(text,text) from authenticated;
commit;
