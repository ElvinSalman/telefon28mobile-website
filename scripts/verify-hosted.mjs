// Explicit production smoke test with isolated QA identities and fixture cleanup.
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {chromium} from '@playwright/test';
const site='https://telefon28mobile-website.vercel.app';
const url='https://bpsmcmmdtxteeswaumse.supabase.co';
const pub='sb_publishable_tAIO6n5qMN1mxB_TBbod5A_WTVAHTxe';
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
  check((await post({op:'product',id:productId,record:{...record,status:'published',price:23.45}})).status()===204,'admin edits and publishes');
  await page.goto(site+'/en/products/'+slug);check(await page.locator('h1').textContent()==='QA release verification','public product appears without deployment');
  check((await anon.from('products').select('price').eq('slug',slug).single()).data?.price===23.45,'edited price persisted');
  const quote=await context.request.post(site+'/api/quote',{headers:{origin:site},data:{locale:'en',lines:[{slug,qty:2,price:23.45}]}});check(quote.ok(),'WhatsApp server quote');
  const trade=await context.request.post(site+'/api/trade-in',{headers:{origin:site},data:{name:slug,phone:'+994000000000',model:'QA test device',storage:'128GB',condition:'good',notes:'Automated verification, remove after test.',consent:true,website:''}});check(trade.ok(),'production trade-in submission');
  check(sql(`select id from public.trade_in_requests where name='${slug}'`).length===1,'trade-in persisted in PostgreSQL');
  check((await post({op:'archive',slug})).status()===204,'admin archive');
  check((await anon.from('products').select('id').eq('slug',slug)).data?.length===0,'archived product hidden');
  for(const locale of ['az','ru','en']){await page.goto(site+'/'+locale);check(await page.locator('h1').isVisible(),locale+' storefront renders');}
  console.log('Hosted CRUD smoke verification completed. QA traffic contributes real aggregate events.');
}finally{
  if(browser)await browser.close();
  if(productId){const paths=sql(`select path from public.product_images where product_id='${productId}'`).map(x=>x.path);if(paths.length)await service.storage.from('product-images').remove(paths);sql(`delete from public.products where id='${productId}';`);}
  sql(`delete from public.trade_in_requests where name='${slug}';`);
  if(userId)await service.auth.admin.deleteUser(userId);
  console.log('QA account, product, image and trade-in cleaned up.');
}
