#!/usr/bin/env bash
set -euo pipefail

cert_dir="${CODE_SIGN_CERT_DIR:-certs}"
password="${CODE_SIGN_CERT_PASSWORD:-}"
cert_path="${CODE_SIGN_CERT_PATH:-$cert_dir/home-shopping-scheduler-code-signing.crt}"
key_path="${CODE_SIGN_KEY_PATH:-$cert_dir/home-shopping-scheduler-code-signing.key}"

if [[ ! -f "$cert_path" || ! -f "$key_path" ]]; then
  echo "Code-signing certificate not found. Run scripts/create-self-signed-code-signing-cert.sh first." >&2
  exit 1
fi

if [[ "$#" -eq 0 ]]; then
  set -- build/bin/home-shopping-scheduler.exe
fi

for exe_path in "$@"; do
  if [[ ! -f "$exe_path" ]]; then
    echo "Executable not found: $exe_path" >&2
    exit 1
  fi

  signed_path="${exe_path%.exe}.signed.exe"
  pass_args=()
  if [[ -n "$password" ]]; then
    pass_args=(-pass "$password")
  fi

  osslsigncode sign \
    -certs "$cert_path" \
    -key "$key_path" \
    "${pass_args[@]}" \
    -h sha256 \
    -n "방송 일정 등록기" \
    -in "$exe_path" \
    -out "$signed_path"

  mv "$signed_path" "$exe_path"
  chmod a+rwX "$exe_path"
  echo "Signed $exe_path"
done

cp "$cert_path" build/bin/home-shopping-scheduler-code-signing.crt
cp scripts/windows/install-local-code-signing-cert.ps1 build/bin/
cp scripts/windows/install-local-code-signing-cert.cmd build/bin/

for windows_script in \
  build/bin/install-local-code-signing-cert.ps1 \
  build/bin/install-local-code-signing-cert.cmd
do
  tmp_script="${windows_script}.tmp"
  awk '{ sub(/\r$/, ""); printf "%s\r\n", $0 }' "$windows_script" > "$tmp_script"
  mv "$tmp_script" "$windows_script"
done

chmod a+rwX \
  build/bin/home-shopping-scheduler-code-signing.crt \
  build/bin/install-local-code-signing-cert.ps1 \
  build/bin/install-local-code-signing-cert.cmd
