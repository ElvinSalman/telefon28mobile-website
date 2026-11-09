begin;
alter table public.products add column source_url text,
  add column source_verified_at timestamptz,
  add column featured boolean not null default false;
alter table public.products add constraint product_source_https check(source_url is null or source_url ~ '^https://');
grant delete on public.product_images to authenticated;
create function public.shop_move_image(product uuid, from_slot int, to_slot int)
returns void language plpgsql security invoker set search_path='' as $$
declare a public.product_images; b public.product_images;
begin
  if not public.shop_admin() then raise exception 'Admin required'; end if;
  if from_slot not between 0 and 7 or to_slot not between 0 and 7 then raise exception 'Invalid slot'; end if;
  if from_slot=to_slot then return; end if;
  perform id from public.products where id=product for update;
  select * into a from public.product_images where product_id=product and sort_order=from_slot;
  if a.id is null then raise exception 'Image missing'; end if;
  select * into b from public.product_images where product_id=product and sort_order=to_slot;
  delete from public.product_images where product_id=product and sort_order in (from_slot,to_slot);
  insert into public.product_images(id,product_id,path,alt,sort_order) values(a.id,product,a.path,a.alt,to_slot);
  if b.id is not null then
    insert into public.product_images(id,product_id,path,alt,sort_order) values(b.id,product,b.path,b.alt,from_slot);
  end if;
end $$;
revoke all on function public.shop_move_image(uuid,int,int) from public,anon;
grant execute on function public.shop_move_image(uuid,int,int) to authenticated;
commit;
