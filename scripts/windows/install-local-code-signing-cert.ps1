param(
  [string]$CertificatePath = ".\home-shopping-scheduler-code-signing.crt"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $CertificatePath)) {
  throw "Certificate file not found: $CertificatePath"
}

$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw "관리자 권한 PowerShell에서 실행해 주세요."
}

$rootStore = New-Object Security.Cryptography.X509Certificates.X509Store("Root", "LocalMachine")
$publisherStore = New-Object Security.Cryptography.X509Certificates.X509Store("TrustedPublisher", "LocalMachine")
$certificate = New-Object Security.Cryptography.X509Certificates.X509Certificate2((Resolve-Path $CertificatePath))

$rootStore.Open("ReadWrite")
$rootStore.Add($certificate)
$rootStore.Close()

$publisherStore.Open("ReadWrite")
$publisherStore.Add($certificate)
$publisherStore.Close()

Write-Host "인증서를 LocalMachine Root 및 TrustedPublisher 저장소에 등록했습니다."
