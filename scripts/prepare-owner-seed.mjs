// One-time owner-authorized catalog import. No marketplace fetching or live sync.
import fs from 'node:fs';
import {createClient} from '@supabase/supabase-js';
const seed=JSON.parse(fs.readFileSync('data/verified-listings.json','utf8'));
const quote=value=>"'"+String(value).replaceAll("'","''")+"'";
const sql=['begin;'];
for(const p of seed.products){
  if(!p.imageReusePermission||!p.sourceUrl||!p.localImage)throw Error('Unapproved seed');
  const brand=p.brand.toLowerCase();
  sql.push(`insert into public.brands(slug,name) values(${quote(brand)},${quote(p.brand)}) on conflict do nothing;`);
  sql.push(`insert into public.products(slug,name,brand_id,category_id,price,storage,color,condition,description,status,origin) values(${quote(p.slug)},${quote(p.name)},${quote(brand)},${quote(p.category)},${Number(p.price)},${quote(p.storage)},${quote(p.color)},${p.condition?quote(p.condition):'null'},${quote(JSON.stringify(p.description))}::jsonb,'published','owner_import') on conflict(slug) do nothing;`);
  sql.push(`update public.products set source_url=${quote(p.sourceUrl)},source_verified_at=${quote(p.reviewedOn+'T12:00:00Z')} where slug=${quote(p.slug)} and source_url is null;`);
  sql.push(`insert into public.product_images(product_id,path,alt,sort_order) select id,${quote('launch/'+p.slug+'.webp')},${quote(p.sourceTitle)},0 from public.products where slug=${quote(p.slug)} on conflict(product_id,sort_order) do nothing;`);
}
sql.push('commit;');
fs.mkdirSync('supabase/seeds',{recursive:true});
fs.writeFileSync('supabase/seeds/owner-listings.sql',sql.join('\n')+'\n');
if(process.argv.includes('--upload')){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  if(!['https://bpsmcmmdtxteeswaumse.supabase.co','http://127.0.0.1:55321'].includes(url))throw Error('Unexpected project');
  const db=createClient(url,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false}});
  for(const p of seed.products){
    const r=await db.storage.from('product-images').upload('launch/'+p.slug+'.webp',fs.readFileSync('public'+p.localImage),{contentType:'image/webp',upsert:false});
    if(r.error&&r.error.message!=='The resource already exists')throw Error('Upload failed for '+p.slug+': '+r.error.message);
  }
}
console.log(`Prepared ${seed.products.length} verified products. Existing product rows are never overwritten.`);
