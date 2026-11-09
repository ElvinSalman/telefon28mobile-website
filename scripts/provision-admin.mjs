// Operator-only CLI, never imported into the application. Password arrives via stdin.
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createClient} from '@supabase/supabase-js';
function run(command){const r=spawnSync('cmd.exe',['/d','/s','/c',command],{encoding:'utf8',windowsHide:true});if(r.status)throw Error('Supabase CLI operation failed; verify your authorized CLI sign-in.');return r.stdout;}
try {
  process.loadEnvFile('.env.local');
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  if(url!=='https://bpsmcmmdtxteeswaumse.supabase.co')throw Error('Wrong project configuration');
  const input=JSON.parse(fs.readFileSync(0,'utf8').replace(/^\uFEFF/,''));
  if(typeof input.email!=='string'||!/^\S+@\S+\.\S+$/.test(input.email)||typeof input.password!=='string'||input.password.length<16||input.password.length>128)throw Error('Valid email and 16–128 character password required');
  const keys=JSON.parse(run('npx --yes supabase projects api-keys --project-ref bpsmcmmdtxteeswaumse -o json'));
  const secret=keys.find(k=>k.name==='service_role')?.api_key;
  if(!secret)throw Error('Authorized server credential unavailable');
  const db=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
  const created=await db.auth.admin.createUser({email:input.email,password:input.password,email_confirm:true});
  input.password='';
  if(created.error)throw Error('Account was not created. If it already exists, use the documented Dashboard allowlist procedure; this script never resets existing accounts.');
  const id=created.data.user.id;
  if(!/^[a-f0-9-]{36}$/.test(id))throw Error('Unexpected user identifier');
  fs.mkdirSync('.vercel',{recursive:true});
  const file='.vercel/admin-membership.sql';
  try {
    fs.writeFileSync(file,`insert into public.admin_memberships(user_id) select id from auth.users where id='${id}' and email_confirmed_at is not null on conflict do nothing;`);
    run('npx --yes supabase db query --linked --file '+file+' -o json');
  } finally {if(fs.existsSync(file))fs.unlinkSync(file);}
  console.log('Administrator created and allowlisted. Open https://telefon28mobile-website.vercel.app/admin/login. No email was sent.');
} catch(error){console.error(error instanceof Error?error.message:'Provisioning failed');process.exitCode=1;}
