// Production acceptance uses ephemeral QA Auth accounts. Never reads or resets owner credentials.
import {spawnSync} from 'node:child_process';
process.loadEnvFile('.env.local');
if(process.env.NEXT_PUBLIC_SUPABASE_URL!=='https://bpsmcmmdtxteeswaumse.supabase.co')throw Error('Existing project required');
const keys=spawnSync('cmd.exe',['/d','/s','/c','npx --yes supabase projects api-keys --project-ref bpsmcmmdtxteeswaumse -o json'],{encoding:'utf8',windowsHide:true});
if(keys.status)throw Error('Authorized Supabase CLI required');
const secret=JSON.parse(keys.stdout).find(k=>k.name==='service_role')?.api_key;
if(!secret)throw Error('Server credential unavailable');
const result=spawnSync('cmd.exe',['/d','/s','/c','npx playwright test --workers=1 --reporter=line'],{stdio:'inherit',windowsHide:true,env:{...process.env,SUPABASE_SECRET_KEY:secret,TEST_ORIGIN:'https://telefon28mobile-website.vercel.app',REPAIR_HOSTED_QA:'approved'}});
process.exitCode=result.status||0;
