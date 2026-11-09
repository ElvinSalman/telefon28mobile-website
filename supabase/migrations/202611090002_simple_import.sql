begin;
alter table public.products add column import_key text unique;
create function public.shop_resolve_brand(brand_name text, preferred_slug text)
returns text language plpgsql security invoker set search_path='' as $$
declare normalized text; found_slug text; candidate text;
begin
 if not public.shop_admin() then raise insufficient_privilege; end if;
 brand_name:=trim(regexp_replace(brand_name,'\s+',' ','g'));
 if length(brand_name) not between 1 and 160 then raise exception 'Invalid brand'; end if;
 normalized:=lower(brand_name);
 perform pg_advisory_xact_lock(hashtextextended('t28-brand:'||normalized,0));
 select slug into found_slug from public.brands where lower(trim(regexp_replace(name,'\s+',' ','g')))=normalized order by slug limit 1;
 if found_slug is not null then return found_slug; end if;
 candidate:=case when preferred_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' then left(preferred_slug,140) else 'brend' end;
 if exists(select 1 from public.brands where slug=candidate) then candidate:=candidate||'-'||substr(md5(normalized),1,8); end if;
 insert into public.brands(slug,name) values(candidate,brand_name);
 return candidate;
end $$;
revoke all on function public.shop_resolve_brand(text,text) from public,anon;
grant execute on function public.shop_resolve_brand(text,text) to authenticated;

create function public.shop_import_products(items jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare r jsonb; b text; p public.products; matches int; candidate text; results jsonb:='[]'; row_no text; is_new boolean;
begin
 if not public.shop_admin() then raise insufficient_privilege; end if;
 if jsonb_typeof(items)<>'array' or jsonb_array_length(items) not between 1 and 200 then raise exception 'Invalid import size'; end if;
 perform pg_advisory_xact_lock(hashtextextended('t28-import',0));
 for r in select value from jsonb_array_elements(items) loop
  row_no:=r->>'row'; p:=null; is_new:=false;
  if not exists(select 1 from public.categories where slug=r->>'category' and active) then raise exception 'IMPORT_ROW_% CATEGORY',row_no; end if;
  b:=public.shop_resolve_brand(r->>'brand',r->>'brand_slug');
  select * into p from public.products where import_key=r->>'import_key' for update;
  if p.id is not null and nullif(r->>'target_id','') is not null and p.id<>(r->>'target_id')::uuid then raise exception 'IMPORT_ROW_% CONFLICT',row_no; end if;
  if p.id is null and nullif(r->>'target_id','') is not null then
   select * into p from public.products where id=(r->>'target_id')::uuid for update;
   if p.id is null then raise exception 'IMPORT_ROW_% MISSING',row_no; end if;
  end if;
  if p.id is null then
   select count(*) into matches from public.products where lower(trim(regexp_replace(name,'\s+',' ','g')))=lower(r->>'name') and brand_id=b and lower(trim(storage))=lower(r->>'storage') and lower(trim(color))=lower(r->>'color');
   if matches>1 then raise exception 'IMPORT_ROW_% AMBIGUOUS',row_no; end if;
   if matches=1 then select * into p from public.products where lower(trim(regexp_replace(name,'\s+',' ','g')))=lower(r->>'name') and brand_id=b and lower(trim(storage))=lower(r->>'storage') and lower(trim(color))=lower(r->>'color') for update; end if;
  end if;
  if p.id is not null then
   if nullif(r->>'expected_updated_at','') is not null and p.updated_at<>(r->>'expected_updated_at')::timestamptz then raise exception 'IMPORT_ROW_% CONFLICT',row_no; end if;
   if p.import_key is not null and p.import_key<>r->>'import_key' then raise exception 'IMPORT_ROW_% IDENTITY',row_no; end if;
   update public.products set name=r->>'name',price=(r->>'price')::numeric,brand_id=b,category_id=r->>'category',
    storage=case when coalesce(r->>'storage','')='' then storage else r->>'storage' end,
    color=case when coalesce(r->>'color','')='' then color else r->>'color' end,
    description=case when coalesce(r->>'description','')='' then description else description||jsonb_build_object('az',r->>'description') end,
    import_key=r->>'import_key' where id=p.id returning * into p;
  else
   is_new:=true;candidate:=r->>'slug';
   if exists(select 1 from public.products where slug=candidate) then candidate:=left(candidate,140)||'-'||substr(md5(r->>'import_key'),1,8); end if;
   insert into public.products(slug,name,brand_id,category_id,price,storage,color,description,status,origin,import_key)
    values(candidate,r->>'name',b,r->>'category',(r->>'price')::numeric,coalesce(r->>'storage',''),coalesce(r->>'color',''),
      case when coalesce(r->>'description','')='' then '{}'::jsonb else jsonb_build_object('az',r->>'description') end,'published','owner_import',r->>'import_key') returning * into p;
  end if;
  results:=results||jsonb_build_array(jsonb_build_object('id',p.id,'slug',p.slug,'new',is_new,'row',row_no));
 end loop;
 return results;
end $$;
revoke all on function public.shop_import_products(jsonb) from public,anon;
grant execute on function public.shop_import_products(jsonb) to authenticated;
-- Durable, admin-only cleanup of superseded images. References commit before files are removed.
create table public.image_cleanup(path text primary key, created_at timestamptz not null default now());
alter table public.image_cleanup enable row level security;
grant select,insert,delete on public.image_cleanup to authenticated;
create policy admin_cleanup on public.image_cleanup for all to authenticated using(public.shop_admin()) with check(public.shop_admin());
create function public.shop_queue_image_cleanup() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if tg_op='DELETE' or old.path is distinct from new.path then insert into public.image_cleanup(path) values(old.path) on conflict do nothing; end if;
 return null;
end $$;
create trigger image_cleanup_queue after update or delete on public.product_images for each row execute function public.shop_queue_image_cleanup();
create function public.shop_write_image(product uuid,slot integer,new_path text,new_alt text,expected_path text)
returns void language plpgsql security invoker set search_path='' as $$
declare previous text;
begin
 if not public.shop_admin() then raise insufficient_privilege; end if;
 perform 1 from public.products where id=product for update;
 if not found then raise exception 'Image product missing'; end if;
 select path into previous from public.product_images where product_id=product and sort_order=slot;
 if previous is distinct from expected_path then raise exception 'IMAGE_CONFLICT'; end if;
 if new_path is null then
  delete from public.product_images where product_id=product and sort_order=slot;
 else
  insert into public.product_images(product_id,sort_order,path,alt) values(product,slot,new_path,new_alt)
  on conflict(product_id,sort_order) do update set path=excluded.path,alt=excluded.alt;
 end if;
end $$;
revoke all on function public.shop_write_image(uuid,integer,text,text,text) from public,anon;
grant execute on function public.shop_write_image(uuid,integer,text,text,text) to authenticated;
commit;

