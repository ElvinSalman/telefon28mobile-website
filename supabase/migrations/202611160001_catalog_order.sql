begin;
create sequence public.catalog_positions;
alter table public.products add column catalog_position bigint;
-- Position-only changes preserve the product's editorial timestamp.
create or replace function shop_private.touch_product() returns trigger language plpgsql set search_path='' as $$begin
if (to_jsonb(new)-'catalog_position') is distinct from (to_jsonb(old)-'catalog_position') then new.updated_at=now();end if;return new;end$$;
with ranked as (select id,row_number() over(order by updated_at desc,id) n from public.products)
update public.products p set catalog_position=r.n from ranked r where p.id=r.id;
select setval('public.catalog_positions',coalesce((select max(catalog_position) from public.products),0)+1,false);
alter table public.products alter column catalog_position set default nextval('public.catalog_positions'),alter column catalog_position set not null;
alter table public.products add constraint catalog_position_unique unique(catalog_position) deferrable initially immediate;
grant usage on sequence public.catalog_positions to authenticated;
create function public.shop_reorder_products(ordered_ids uuid[],expected jsonb) returns void language plpgsql security invoker set search_path='' as $$
declare slots bigint[];actual jsonb;
begin
 if not public.shop_admin() then raise insufficient_privilege; end if;
 perform pg_advisory_xact_lock(281116);
 perform 1 from public.products where id=any(ordered_ids) order by id for update;
 select array_agg(catalog_position order by catalog_position),jsonb_agg(jsonb_build_object('id',id,'position',catalog_position) order by catalog_position) into slots,actual from public.products where id=any(ordered_ids);
 if cardinality(slots)<>cardinality(ordered_ids) or actual is distinct from expected then raise exception 'PRODUCT_CONFLICT';end if;
 set constraints public.catalog_position_unique deferred;
 update public.products p set catalog_position=slots[o.n] from unnest(ordered_ids) with ordinality o(id,n) where p.id=o.id;
end $$;
revoke all on function public.shop_reorder_products(uuid[],jsonb) from public,anon;
grant execute on function public.shop_reorder_products(uuid[],jsonb) to authenticated;
commit;
