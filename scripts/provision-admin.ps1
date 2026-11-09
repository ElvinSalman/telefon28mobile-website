param([Parameter(Mandatory=$true)][string]$Email,[switch]$OwnerConfirmed)
$ErrorActionPreference='Stop'
$OutputEncoding=[System.Text.UTF8Encoding]::new($false)
if (!$OwnerConfirmed) {throw 'Confirm the owner controls this email in person, then use -OwnerConfirmed. No account was created.'}
# Run in your own terminal. Never send passwords in chat or pass them as arguments.
$first=Read-Host 'New administrator password (16+ characters)' -AsSecureString
$second=Read-Host 'Repeat password' -AsSecureString
$a=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($first)
$b=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($second)
try {
  $plain=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($a)
  if ($plain -ne [Runtime.InteropServices.Marshal]::PtrToStringBSTR($b)) {throw 'Passwords do not match'}
  if ($plain.Length -lt 16 -or $plain.Length -gt 128) {throw 'Use 16–128 characters'}
  @{email=$Email;password=$plain;ownerConfirmed=$true} | ConvertTo-Json -Compress | node scripts/provision-admin.mjs
  if ($LASTEXITCODE -ne 0) {throw 'Provisioning did not complete; read the non-secret error above'}
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($a)
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($b)
  $plain=$null;$first.Dispose();$second.Dispose()
}

