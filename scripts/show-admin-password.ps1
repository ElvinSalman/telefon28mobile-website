# Run personally in PowerShell. Do not run through chat tools or paste the output into chat.
$ErrorActionPreference='Stop'
$file=Join-Path $PSScriptRoot '../.vercel/first-admin-password.dpapi'
$secure=Get-Content -LiteralPath $file -Raw | ConvertTo-SecureString
$pointer=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
  Write-Host 'Temporary administrator password (change it after signing in):'
  Write-Host ([Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer))
  Write-Host 'Login: https://telefon28mobile-website.vercel.app/admin/login'
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
  $secure.Dispose()
}
