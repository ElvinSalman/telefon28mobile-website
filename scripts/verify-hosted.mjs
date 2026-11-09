// Explicit production smoke test with isolated QA identities and fixture cleanup.
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {chromium} from '@playwright/test';
const site='https://telefon28mobile-website.vercel.app';
process.loadEnvFile('.env.local');
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,pub=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if(url!=='https://bpsmcmmdtxteeswaumse.supabase.co'||!pub)throw Error('Existing hosted project configuration required');
function cli(command){const r=spawnSync('cmd.exe',['/d','/s','/c',command],{encoding:'utf8',windowsHide:true});if(r.status)throw Error('CLI operation failed');return r.stdout;}
function sql(query){fs.writeFileSync('.vercel/hosted-qa.sql',query);try{return JSON.parse(cli('npx --yes supabase db query --linked --file .vercel/hosted-qa.sql -o json')).rows;}finally{fs.unlinkSync('.vercel/hosted-qa.sql');}}
const keys=JSON.parse(cli('npx --yes supabase projects api-keys --project-ref bpsmcmmdtxteeswaumse -o json'));
const key=keys.find(k=>k.name==='service_role')?.api_key;
const service=createClient(url,key,{auth:{persistSession:false}}),anon=createClient(url,pub,{auth:{persistSession:false}});
const run=randomUUID().slice(0,8),slug='qa-release-'+run,email=slug+'@example.test',password=randomUUID()+'Aa9!';
let userId,productId,browser;
function check(ok,message){if(!ok)throw Error(message);console.log('PASS '+message);}
try{
  check((await anon.from('products').select('id')).data?.length>=10,'verified launch catalog reads');
  const created=await service.auth.admin.createUser({email,password,email_confirm:true});
  if(created.error)throw Error(created.error.message);userId=created.data.user.id;
  check(/^[a-f0-9-]{36}$/.test(userId),'QA identity created');
  const link=await service.auth.admin.generateLink({type:'recovery',email,options:{redirectTo:site+'/auth/callback'}});
  if(link.error)throw Error('Could not test callback allowlist');
  const verified=await fetch(link.data.properties.action_link,{redirect:'manual'});
  const redirect=verified.headers.get('location');
  console.log('Exact callback redirect allowed:',!!redirect&&new URL(redirect).origin===site&&new URL(redirect).pathname==='/auth/callback');
  const ordinary=createClient(url,pub,{auth:{persistSession:false}});
  check(!(await ordinary.auth.signInWithPassword({email,password})).error,'confirmed password account works without SMTP');
  check((await ordinary.rpc('shop_admin')).data===false,'unallowlisted user has no admin role');
  check(!!(await ordinary.from('products').insert({slug,name:'Denied',brand_id:'apple',category_id:'phone',price:1})).error,'ordinary catalog write rejected');
  check(!(await ordinary.from('trade_in_requests').select('id')).data?.length,'ordinary user cannot read trade-in PII');
  sql(`insert into public.admin_memberships(user_id) values('${userId}');`);
  browser=await chromium.launch({channel:'chrome',headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
  await page.goto(site+'/admin/login');
  await page.getByLabel('E-poçt',{exact:true}).first().fill(email);await page.getByLabel('Şifrə',{exact:true}).fill(password);
  await page.getByRole('button',{name:'Daxil ol'}).click();await page.waitForURL(site+'/admin');check(true,'production admin password login');
  const post=(data)=>context.request.post(site+'/api/admin',{headers:{origin:site},data});
  const record={slug,name:'QA release verification',brand_id:'apple',category_id:'phone',price:12.34,status:'draft',description:{az:'QA',ru:'QA',en:'QA'}};
  check((await post({op:'product',record})).status()===204,'admin creates draft');
  productId=sql(`select id from public.products where slug='${slug}'`)[0].id;
  check((await anon.from('products').select('id').eq('slug',slug)).data?.length===0,'draft hidden by RLS');
  check((await context.request.post(site+'/api/admin/image',{headers:{origin:site},multipart:{id:productId,index:'0',alt:'QA authorized photograph',file:{name:'photo.webp',mimeType:'image/webp',buffer:fs.readFileSync('public/catalog/49076729.webp')}}})).status()===201,'authenticated photograph upload');
  check((await context.request.post(site+'/api/admin/image',{headers:{origin:site},multipart:{id:productId,index:'1',alt:'QA second photo',file:{name:'second.webp',mimeType:'image/webp',buffer:fs.readFileSync('public/catalog/49041247.webp')}}})).status()===201,'second photograph upload');
  check((await post({op:'image-move',product:productId,from:1,to:0})).status()===204,'gallery reorder');
  check((await post({op:'image-delete',product:productId,index:1})).status()===204,'gallery image removal');
  check((await post({op:'product',id:productId,record:{...record,status:'published',price:23.45}})).status()===204,'admin edits and publishes');
  await page.goto(site+'/en/products/'+slug);check(await page.locator('h1').textContent()==='QA release verification','public product appears without deployment');
  check((await anon.from('products').select('price').eq('slug',slug).single()).data?.price===23.45,'edited price persisted');
  check((await context.request.post(site+'/api/quote',{headers:{origin:site},data:{locale:'en',lines:[{slug,qty:1,price:12.34}]}})).status()===409,'stale cart price rejected');
  const quote=await context.request.post(site+'/api/quote',{headers:{origin:site},data:{locale:'en',lines:[{slug,qty:2,price:23.45}]}});check(quote.ok(),'WhatsApp server quote'); const target=(await quote.json()).url;check(target.startsWith('https://wa.me/994556002001?text=')&&decodeURIComponent(target).includes('46.90'),'WhatsApp destination and current-price total');
  const trade=await context.request.post(site+'/api/trade-in',{headers:{origin:site},data:{name:slug,phone:'+994000000000',model:'QA test device',storage:'128GB',condition:'good',notes:'Automated verification, remove after test.',consent:true,website:''}});check(trade.ok(),'production trade-in submission');
  check(sql(`select id from public.trade_in_requests where name='${slug}'`).length===1,'trade-in persisted in PostgreSQL');
  for(const kind of ['page_view','product_view','whatsapp_click']){
    const response=await context.request.post(site+'/api/events',{headers:{origin:site},data:{kind,item:slug}});
    check(response.status()===204,'real '+kind+' event accepted');
    check(sql(`select count from public.daily_stats where subject='${slug}' and event='${kind}'`).some(r=>Number(r.count)>0),'persisted '+kind+' count');
  }
  check((await post({op:'archive',slug})).status()===204,'admin archive');
  check((await anon.from('products').select('id').eq('slug',slug)).data?.length===0,'archived product hidden');
  for(const locale of ['az','ru','en']){await page.goto(site+'/'+locale);check(await page.locator('h1').isVisible(),locale+' storefront renders');}
  await page.goto(site+'/admin/password');
  await page.getByLabel('Cari şifrə',{exact:true}).fill(password);
  await page.getByLabel('Yeni şifrə · minimum 12 simvol',{exact:true}).fill(password+'Z');
  await page.getByLabel('Yeni şifrəni təkrar edin',{exact:true}).fill(password+'Z');
  await page.getByRole('button',{name:'Saxla',exact:true}).click();await page.waitForURL(site+'/admin');
  check(!(await createClient(url,pub,{auth:{persistSession:false}}).auth.signInWithPassword({email,password:password+'Z'})).error,'production password change without email');
  console.log('Hosted CRUD smoke verification completed. QA traffic contributes real aggregate events.');
}finally{
  if(browser)await browser.close();
  if(productId){const paths=sql(`select path from public.product_images where product_id='${productId}'`).map(x=>x.path);if(paths.length)await service.storage.from('product-images').remove(paths);sql(`delete from public.product_images where product_id='${productId}'; delete from public.products where id='${productId}';`);}
  sql(`delete from public.trade_in_requests where name='${slug}'; delete from public.daily_stats where subject='${slug}';`);
  if(userId)await service.auth.admin.deleteUser(userId);
  console.log('QA account, product, image and trade-in cleaned up.');
}
