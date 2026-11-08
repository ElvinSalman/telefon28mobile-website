$ErrorActionPreference='Continue'
# Test credentials stay in this process and never enter an environment file.
$lines = npx.cmd --yes supabase@2.109.1 status -o env 2>$null
foreach ($line in $lines) {
 if ($line -match '^([A-Z_]+)="([^"]*)"$') {
  switch ($matches[1]) {
   'API_URL' { $env:NEXT_PUBLIC_SUPABASE_URL=$matches[2] }
   'ANON_KEY' { $env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$matches[2] }
   'SERVICE_ROLE_KEY' { $env:SUPABASE_SECRET_KEY=$matches[2] }
  }
 }
}
if ($env:NEXT_PUBLIC_SUPABASE_URL -ne 'http://127.0.0.1:55321' -or !$env:SUPABASE_SECRET_KEY) { throw 'An isolated local Supabase instance is required.' }
$env:NEXT_PUBLIC_SITE_URL='http://127.0.0.1:3028'
$env:CI='1'
& npm.cmd run build
if ($LASTEXITCODE -ne 0) {exit $LASTEXITCODE}
& npm.cmd test
exit $LASTEXITCODE
