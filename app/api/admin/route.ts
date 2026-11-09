import {cleanImages} from "@/lib/image-cleanup";
import {adminDb} from '@/lib/db';
import {productInput,slug,slugify} from '@/lib/validation';
import {z} from 'zod';
import {body,sameOrigin} from '@/lib/ingest';
import {adminError,validationError,databaseError} from '@/lib/admin-errors';
import {importIdentity,derivedSlug,normalizeName} from '@/lib/simple-import';
const word=z.string().trim().min(1).max(160);
const simpleRow=z.object({row:z.number().int().min(2).max(10000),name:word,price:z.number().min(0).max(9999999999).multipleOf(.01),brand:word,storage:z.string().max(80),color:z.string().max(80),description:z.string().max(4000),category:slug,target_id:z.uuid().optional(),expected_updated_at:z.iso.datetime({offset:true}).optional()});
const action=z.discriminatedUnion('op',[
 z.object({op:z.literal('product'),id:z.uuid().optional(),expected_updated_at:z.iso.datetime({offset:true}).optional(),record:productInput}),
 z.object({op:z.literal('import'),rows:z.array(simpleRow).min(1).max(200)}),
 z.object({op:z.literal('archive'),slug}),
 z.object({op:z.literal('image-cleanup')}),
 z.object({op:z.literal('image-delete'),product:z.uuid(),index:z.number().int().min(0).max(7),expected_path:z.string().max(250).optional()}),
 z.object({op:z.literal('image-move'),product:z.uuid(),from:z.number().int().min(0).max(7),to:z.number().int().min(0).max(7)}),
 z.object({op:z.literal('brand'),slug:slug.optional(),name:word}),
 z.object({op:z.literal('category'),slug,az:word,ru:word,en:word,sort_order:z.number().int(),active:z.boolean()}),
 z.object({op:z.literal('store'),id:z.uuid().optional(),name:word,address:word,phone:z.string().max(32),hours:z.string().max(150),map_url:z.union([z.string().url().startsWith('https://'),z.literal('')]),sort_order:z.number().int(),active:z.boolean()}),
 z.object({op:z.literal('settings'),whatsapp:z.string().regex(/^[1-9][0-9]{7,14}$/)}),
 z.object({op:z.literal('trade'),id:z.uuid(),status:z.enum(['new','contacted','closed'])}),
]);
export async function POST(req:Request){
 const db=await adminDb();
 if(!db)return adminError(403,'FORBIDDEN','Sessiya bitib və ya idarəçi icazəsi yoxdur.');
 if(!sameOrigin(req))return adminError(403,'ORIGIN','Sorğunun mənbəyi qəbul edilmir.');
 try{
  const a=action.parse(await body(req,1000000));let result;
  switch(a.op){
   case 'product':{
    if(a.id){
     const existing=await db.from('products').select('id,slug').eq('id',a.id).maybeSingle();
     if(existing.error)return databaseError(existing.error);
     if(!existing.data)return adminError(404,'NOT_FOUND','Məhsul tapılmadı.');
     if(existing.data.slug!==a.record.slug)return adminError(422,'STABLE_SLUG','Mövcud məhsulun keçidi dəyişdirilə bilməz.',{slug:'Adı dəyişmək slug-u dəyişmir.'});
     const {slug:stable,...editable}=a.record;void stable;
     let query=db.from('products').update(editable).eq('id',a.id);
     if(a.expected_updated_at)query=query.eq('updated_at',a.expected_updated_at);
     result=await query.select('id,slug,updated_at').single();
    }else result=await db.from('products').insert(a.record).select('id,slug,updated_at').single();
    if(result.error)return databaseError(result.error);return Response.json({product:result.data,affected:1});
   }
   case 'import':{
    if(new Set(a.rows.map(importIdentity)).size!==a.rows.length)return adminError(422,'DUPLICATE_ROWS','Cədvəldə təkrar məhsul var.');
    result=await db.rpc('shop_import_products',{items:a.rows.map(r=>({...r,brand:r.brand.trim().replace(/\s+/g,' '),brand_slug:slugify(r.brand)||'brend',slug:derivedSlug(r),import_key:importIdentity(r)}))});
    if(result.error)return databaseError(result.error);return Response.json({items:result.data,success:a.rows.length,failed:0});
   }
   case 'brand':{
    const name=a.name.trim().replace(/\s+/g,' ');
    if(a.slug){const brands=await db.from('brands').select('slug,name');if(brands.error)return databaseError(brands.error);const other=brands.data?.find(b=>normalizeName(b.name)===normalizeName(name)&&b.slug!==a.slug);if(other)return adminError(409,'DUPLICATE_BRAND','Bu brend artıq mövcuddur.');if(brands.data?.some(b=>b.slug===a.slug)){result=await db.from('brands').update({name}).eq('slug',a.slug);if(result.error)return databaseError(result.error);return Response.json({slug:a.slug});}}
    result=await db.rpc('shop_resolve_brand',{brand_name:name,preferred_slug:slugify(name)||'brend'});if(result.error)return databaseError(result.error);return Response.json({slug:result.data});
   }
   case 'image-cleanup':return Response.json({ok:true,cleanupPending:!(await cleanImages(db))});
   case 'image-move':result=await db.rpc('shop_move_image',{product:a.product,from_slot:a.from,to_slot:a.to});break;
   case 'image-delete':{
    const image=await db.from('product_images').select('id,path').eq('product_id',a.product).eq('sort_order',a.index).single();if(image.error)return databaseError(image.error);
    result=await db.rpc('shop_write_image',{product:a.product,slot:a.index,new_path:null,new_alt:null,expected_path:a.expected_path??image.data.path});
    if(result.error)return databaseError(result.error);
    return Response.json({ok:true,cleanupPending:!(await cleanImages(db))});
   }
   case 'archive':result=await db.from('products').update({status:'archived'}).eq('slug',a.slug).select('id').single();break;
   case 'category':{const {op,...row}=a;void op;result=await db.from('categories').upsert(row);break;}
   case 'store':{const {op,...row}=a;void op;result=await db.from('store_locations').upsert({...row,map_url:row.map_url||null});break;}
   case 'settings':result=await db.from('site_settings').update({whatsapp:a.whatsapp}).eq('id',1);break;
   case 'trade':result=await db.from('trade_in_requests').update({status:a.status}).eq('id',a.id).select('id').single();break;
  }
  if(result.error)return databaseError(result.error);return Response.json({ok:true});
 }catch(error){if(error instanceof z.ZodError)return validationError(error);return adminError(400,'BAD_REQUEST','Sorğu oxunmadı. Fayl ölçüsünü və məlumat formatını yoxlayın.');}
}


