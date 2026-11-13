begin;
-- A nullable value deliberately restores legacy archives to draft, never publishes them.
alter table public.products add column archived_from text check(archived_from in ('draft','published'));
create function public.shop_remember_publication() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if new.status='archived' and old.status<>'archived' then new.archived_from=old.status;
 elsif new.status<>'archived' then new.archived_from=null;
 else new.archived_from=old.archived_from;
 end if;
 return new;
end $$;
create trigger remember_publication before update on public.products
for each row execute function public.shop_remember_publication();

grant delete on public.products, public.product_images to authenticated;
create function public.shop_product_action(product_slug text, operation text, expected timestamptz default null)
returns void language plpgsql security invoker set search_path='' as $$
declare p public.products;
begin
 if not public.shop_admin() then raise insufficient_privilege; end if;
 select * into p from public.products where slug=product_slug for update;
 if not found or (expected is not null and p.updated_at<>expected) then
  raise exception 'PRODUCT_CONFLICT';
 end if;
 if operation='archive' then
  update public.products set status='archived' where id=p.id;
 elsif operation='restore' and p.status='archived' then
  update public.products set status=coalesce(p.archived_from,'draft') where id=p.id;
 elsif operation='delete' then
  -- Metadata removal queues file cleanup. Both deletions commit together or neither does.
  delete from public.product_images where product_id=p.id;
  delete from public.products where id=p.id;
 else raise exception 'PRODUCT_CONFLICT';
 end if;
end $$;
revoke all on function public.shop_product_action(text,text,timestamptz) from public,anon;
grant execute on function public.shop_product_action(text,text,timestamptz) to authenticated;
commit;
