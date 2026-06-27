#!/usr/bin/env bash
set -euo pipefail

cert_dir="${CODE_SIGN_CERT_DIR:-certs}"
subject="${CODE_SIGN_SUBJECT:-/CN=Home Shopping Scheduler Local Code Signing/O=Personal Distribution/C=KR}"
days="${CODE_SIGN_CERT_DAYS:-3650}"
password="${CODE_SIGN_CERT_PASSWORD:-}"

mkdir -p "$cert_dir"
chmod 700 "$cert_dir"

key_path="$cert_dir/home-shopping-scheduler-code-signing.key"
cert_path="$cert_dir/home-shopping-scheduler-code-signing.crt"
pfx_path="$cert_dir/home-shopping-scheduler-code-signing.pfx"

openssl req -x509 -newkey rsa:3072 -sha256 -nodes \
  -keyout "$key_path" \
  -out "$cert_path" \
  -days "$days" \
  -subj "$subject" \
  -addext "keyUsage=digitalSignature" \
  -addext "extendedKeyUsage=codeSigning"

openssl pkcs12 -export \
  -inkey "$key_path" \
  -in "$cert_path" \
  -out "$pfx_path" \
  -passout "pass:$password"

chmod 600 "$key_path" "$pfx_path"
chmod 644 "$cert_path"

if [[ "$(id -u)" -eq 0 && -n "${HOST_UID:-}" && -n "${HOST_GID:-}" ]]; then
  chown -R "$HOST_UID:$HOST_GID" "$cert_dir"
fi

printf 'Created code-signing certificate:\n'
printf '  Certificate: %s\n' "$cert_path"
printf '  Private key:  %s\n' "$key_path"
printf '  PFX:          %s\n' "$pfx_path"
