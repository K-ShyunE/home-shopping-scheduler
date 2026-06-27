# Home Shopping Scheduler

Go + Wails 기반의 Windows 데스크톱 앱 프로젝트입니다. 개발/빌드 도구는 Docker Compose 컨테이너 안에 격리했습니다.

호스트에는 Node.js, npm, Go, Wails, NSIS를 설치하지 않습니다. 필요한 도구는 모두 Docker 이미지 내부에 설치됩니다.

현재 컨테이너 기준 주요 버전:

```text
Go 1.26
Node.js v26.3.1
npm 11.16.0
Wails v2.12.0
Vite v8.1.0
```

## 빠른 실행

```bash
docker compose build
docker compose run --rm wails
```

빌드 결과:

```text
build/bin/home-shopping-scheduler.exe
```

Google 계정 연결 기능을 포함해서 빌드하려면 OAuth 클라이언트 ID를 환경변수로 넘깁니다.

```bash
GOOGLE_OAUTH_CLIENT_ID="발급받은-client-id" docker compose run --rm wails
```

`클라이언트 보안 비밀번호`가 있는 Desktop OAuth 클라이언트라면 함께 넘길 수 있습니다.

```bash
GOOGLE_OAUTH_CLIENT_ID="발급받은-client-id" \
GOOGLE_OAUTH_CLIENT_SECRET="발급받은-client-secret" \
docker compose run --rm wails
```

NSIS 설치 파일까지 만들려면:

```bash
make build-windows-installer
```

## 지인 배포용 로컬 코드 서명

Smart App Control은 무서명 앱을 신뢰할 수 없다고 판단하면 실행을 막을 수 있습니다. 공개 코드 서명 인증서를 쓰는 것이 정석이지만, 개인/지인 배포용으로는 자체 코드 서명 인증서를 만들고 지인 PC에 인증서를 등록한 뒤 exe를 서명할 수 있습니다.

```bash
make create-local-cert
make build-windows
make sign-windows
```

`make sign-windows`까지 끝나면 지인에게 전달할 파일이 `build/bin`에 모입니다.

```text
build/bin/home-shopping-scheduler.exe
build/bin/home-shopping-scheduler-code-signing.crt
build/bin/install-local-code-signing-cert.cmd
build/bin/install-local-code-signing-cert.ps1
```

지인 PC에서는 최초 1회만 `install-local-code-signing-cert.cmd`를 더블클릭해서 인증서를 등록합니다. 관리자 권한 확인 창이 뜨면 허용해야 합니다. 이후 같은 인증서로 서명한 새 버전은 `home-shopping-scheduler.exe`만 전달하면 됩니다.

이 방식은 공개 인증기관의 평판을 얻는 방식은 아니므로 모든 Smart App Control 환경에서 100% 통과를 보장하지는 않습니다. 그래도 지인 PC가 서명 인증서를 명시적으로 신뢰하게 만들어 무서명 exe 상태보다 낫습니다. `certs/` 폴더의 `.key`, `.pfx` 파일은 절대 공유하지 마세요.

## WSL + Docker Compose에서 Windows용 Wails 빌드

가능합니다. Wails v2는 `wails build -platform windows/amd64`로 Linux/WSL 컨테이너에서 Windows용 `.exe`를 만들 수 있습니다.

다만 사용자에게 배포할 때는 두 가지를 확인해야 합니다.

1. Windows에 Microsoft Edge WebView2 Runtime이 필요합니다. 대부분의 최신 Windows에는 이미 설치되어 있지만, 없는 PC에서는 설치가 필요할 수 있습니다.
2. 진짜 “한 파일만 전달”하려면 `build/bin/home-shopping-scheduler.exe`를 배포하면 됩니다. 더 친절한 배포 방식은 `-nsis`로 설치 프로그램을 만드는 것입니다.

## 명령어

```bash
make build-image             # Docker 이미지 빌드
make build-windows           # Windows exe 빌드
make build-windows-installer # Windows exe + NSIS installer 빌드
make shell                   # 빌드 컨테이너 쉘 진입
make clean                   # 빌드 산출물 정리
```

## Linux GUI 개발 모드

`wails dev`는 GUI/WebView가 필요해서 Docker 안에서는 X11 설정이 필요합니다.

```bash
xhost +local:docker
make linux-dev
```

WSL에서는 Windows용 빌드만 컨테이너에서 돌리고, 실제 GUI 디버깅은 Windows에 Go/Node/Wails를 설치해서 실행하는 편이 더 안정적입니다.

## 참고

- Wails CLI 공식 문서: https://wails.io/docs/reference/cli/
- Wails Windows installer 문서: https://wails.io/docs/guides/windows-installer/
