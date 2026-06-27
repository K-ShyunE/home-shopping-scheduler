# Home Shopping Scheduler 인수인계 문서

## 1. 현재 상태 요약

브랜치: `main`

이 프로젝트는 홈쇼핑 방송 일정을 Google 스프레드시트와 Google 캘린더에 동시에 등록하는 Windows 데스크톱 앱이다. 대상 사용자는 비개발자이며, 앱 실행 후 Google 계정 연결, 등록 위치 설정, 일정 입력, 등록까지 모두 UI 안에서 처리하는 방향으로 구현되어 있다.

현재 핵심 기능은 대부분 연결되어 있다.

- Google OAuth 연결 가능
- 기존 스프레드시트/캘린더 목록 조회 가능
- 신규 스프레드시트/캘린더 생성 가능
- 일정 입력 후 시트 행 추가 가능
- 일정 입력 후 캘린더 이벤트 생성 가능
- Windows exe 빌드 가능

## 2. 작업 디렉토리

```text
/home/shyun/workdir/home-shopping-scheduler
```

이전 프로젝트명은 `form`이었고, 현재 앱/저장소명은 `home-shopping-scheduler`다.

GitHub 저장소:

```text
K-ShyunE/home-shopping-scheduler
```

## 3. 기술 스택

- Go 1.26
- Wails v2.12.0
- Vite v8.1.0
- Node.js v26.3.1
- npm 11.16.0
- Google OAuth2
- Google Drive API
- Google Sheets API
- Google Calendar API
- Docker Compose 기반 빌드

호스트에 Go/Node/Wails를 직접 설치하지 않는 구조다. 빌드와 Go 명령은 Docker 컨테이너 안에서 실행한다.

## 4. 중요한 파일

백엔드:

- `app.go`
  - 앱 초기화
  - Google OAuth 연결
  - token 저장/삭제
  - 연결 상태 확인
- `google_destination.go`
  - 기존 스프레드시트 목록 조회
  - 기존 캘린더 목록 조회
  - 신규 스프레드시트 생성
  - 신규 캘린더 생성
  - 시트 행 추가
  - 캘린더 이벤트 추가
- `main.go`
  - Wails 앱 설정과 바인딩

프론트엔드:

- `frontend/index.html`
  - 메인 화면 구조
  - Google 연결 패널
  - 등록 위치 패널
  - 일정 입력 폼
  - 설정 패널
- `frontend/src/main.js`
  - localStorage 설정 관리
  - Google 연결 상태 호출
  - 등록 위치 목록 조회
  - 등록 위치 저장
  - 일정 등록 호출
- `frontend/src/style.css`
  - 현재 디자인 전체
  - 디자인 수정 시 가장 많이 만질 파일

자동 생성:

- `frontend/wailsjs/go/main/App.js`
- `frontend/wailsjs/go/main/App.d.ts`
- `frontend/wailsjs/go/models.ts`

이 파일들은 Wails 빌드 과정에서 갱신된다. 수동 편집하지 않는 편이 좋다.

빌드:

- `Dockerfile`
- `docker-compose.yml`
- `Makefile`
- `wails.json`

문서:

- `README.md`
- `docs/PRD.md`
- `docs/HANDOFF.md`

## 5. 환경변수와 보안

`.env`에 Google OAuth 값을 둔다.

```text
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
```

주의:

- `.env`는 Git에 커밋하지 않는다.
- `.env.example`에는 실제 값을 넣지 않는다.
- 배포 전에는 Google OAuth Secret 재발급을 고려한다.
- 현재 구조에서는 빌드 시 OAuth 값이 exe에 포함된다.

## 6. Google Cloud 설정

사용자가 Google Cloud Console에서 다음을 준비했다.

- OAuth 2.0 Client ID
- Desktop app 유형
- Client ID와 Client Secret
- Google Sheets API 사용 설정
- Google Calendar API 사용 설정
- Google Drive API 사용 설정

현재 OAuth scope는 `app.go`의 `googleOAuthConfig`에 있다.

```go
Scopes: []string{
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
},
```

신규 파일 생성/기존 파일 목록 접근 과정에서 권한 문제가 발생하면 scope와 Google Cloud API 사용 설정을 먼저 확인한다.

## 7. 빌드 명령

이미지 빌드:

```bash
docker compose build
```

Windows exe 빌드:

```bash
docker compose run --rm wails
```

결과물:

```text
build/bin/home-shopping-scheduler.exe
```

테스트:

```bash
docker compose --profile tools run --rm --entrypoint /bin/bash shell -c 'go test ./...'
```

프론트 빌드:

```bash
npm run build
```

위 명령은 `frontend/` 디렉토리에서 실행한다.

## 8. 최근 검증 결과

마지막으로 확인한 검증:

- `go test ./...` 성공
- `npm run build` 성공
- `docker compose run --rm wails` 성공

빌드 결과:

```text
build/bin/home-shopping-scheduler.exe
```

## 9. 현재 UI 흐름

메인 화면:

1. Google 연결 상태 표시
2. 등록 위치 요약 표시
3. 날짜 선택
4. 홈쇼핑 선택
5. 업체 선택
6. 제품명 입력
7. 수량 입력
8. 등록 내용 요약
9. 초기화/등록 버튼

등록 위치 패널:

1. 스프레드시트 새로 만들기/기존 선택
2. 캘린더 새로 만들기/기존 선택
3. 기존 선택 시 Google 목록 select 표시
4. 저장 시 localStorage에 선택 정보 저장

설정 패널:

1. 홈쇼핑 목록 편집
2. 업체 목록 편집

## 10. 디자인 수정 시 참고

사용자가 다음 단계에서 디자인 수정 의사가 있다.

디자인을 바꿀 때 우선 확인할 파일:

- `frontend/index.html`
- `frontend/src/style.css`
- `frontend/src/main.js`

현재 디자인 특징:

- 최대 폭 `920px`의 단일 작업 화면
- 흰색 form surface
- Google 연결 패널
- 등록 위치 요약 카드
- 우측 상단에 뜨는 설정형 side panel
- 모바일/좁은 창 대응 media query 있음

디자인 수정 시 유지해야 할 기능적 요소:

- 모든 input/select/button ID는 JS에서 참조하므로 변경 시 `main.js`도 같이 수정해야 한다.
- `connectionLabel`, `connectionTitle`, `connectionText`
- `spreadsheetTitle`, `calendarTitle`
- `destinationPanel`
- `spreadsheetModeNew`, `spreadsheetModeExisting`
- `spreadsheetNameInput`, `spreadsheetSelect`
- `calendarModeNew`, `calendarModeExisting`
- `calendarNameInput`, `calendarSelect`
- `submitButton`, `result`

디자인 방향 제안:

- 최종 사용자가 비개발자이므로 버튼 이름은 짧고 행동 중심으로 유지한다.
- “등록 위치”는 사용자가 자주 바꾸지 않으므로 메인 폼보다 시각적 우선순위를 낮춘다.
- Google 연결 상태는 문제 발생 시 바로 눈에 보여야 하므로 상단에 유지한다.
- 시트/캘린더 ID 같은 내부 값은 노출하지 않는다.
- 폼은 반복 입력에 최적화해야 하므로 과한 장식보다 명확한 간격과 큰 클릭 영역을 우선한다.

## 11. 현재 구현의 주의점

### 11.1 신규 시트/캘린더 생성 타이밍

등록 위치 패널에서 `새로 만들기`를 저장해도 즉시 Google 리소스를 만들지는 않는다. 첫 일정 등록 시 생성한다. 생성 후 응답으로 받은 ID와 제목을 localStorage에 저장하고 이후부터 기존 항목처럼 사용한다.

### 11.2 기존 시트 헤더

신규 시트에는 헤더를 자동 작성한다. 기존 시트를 선택한 경우에는 현재 코드가 헤더를 강제로 확인하거나 보정하지 않는다. 필요하면 다음 작업에서 기존 시트 선택 시 헤더 확인/보정 기능을 추가한다.

### 11.3 캘린더 이벤트 시간

현재 캘린더 이벤트는 종일 이벤트다. 방송 시작/종료 시간이 필요해지면 UI에 시간 입력을 추가하고 `insertCalendarEvent`를 수정해야 한다.

### 11.4 목록 조회 권한

스프레드시트 목록은 Drive API로 조회한다. 사용자가 기존 시트 목록이 보이지 않는다고 하면 다음을 확인한다.

- Google Drive API가 활성화되어 있는가
- OAuth 동의 시 Drive metadata 권한을 허용했는가
- token이 오래되어 새 scope가 반영되지 않았는가

scope가 바뀐 뒤에는 앱에서 Google 계정을 다시 연결해야 할 수 있다.

## 12. 다음 작업 후보

디자인 관련:

- 메인 화면 정보 우선순위 재배치
- 등록 위치 패널을 더 친절한 wizard 형태로 변경
- 연결/미연결 상태의 시각적 차이 강화
- 버튼을 더 큰 터치 영역으로 정리
- 결과 메시지를 toast 또는 status area로 개선

기능 관련:

- Google 연결 해제 버튼 노출
- 선택한 스프레드시트/캘린더 열기 버튼
- 기존 시트 헤더 자동 확인/생성
- 방송 시간 입력
- 등록 실패 상세 로그 저장
- Windows installer 빌드 및 배포 가이드 강화

## 13. 이어서 작업할 때 추천 첫 단계

디자인 수정부터 진행한다면 다음 순서가 좋다.

1. 현재 exe를 실행해 실제 화면을 확인한다.
2. 수정하고 싶은 화면을 메인 폼, 등록 위치 패널, 설정 패널 중 하나로 나눈다.
3. 먼저 `frontend/src/style.css`만 수정해 레이아웃/색/간격을 조정한다.
4. 구조 변경이 필요할 때만 `frontend/index.html`을 수정한다.
5. ID를 바꿨다면 `frontend/src/main.js` 이벤트 바인딩을 함께 수정한다.
6. `npm run build`로 프론트 검증한다.
7. `docker compose run --rm wails`로 exe를 다시 만든다.

## 14. 현재 Git 상태 관련 메모

현재 작업 트리에는 여러 변경 파일이 있다. 대부분 이전 기능 구현과 이번 문서 작업의 누적 변경이다.

주의:

- 사용자가 직접 만든 변경을 되돌리지 않는다.
- `.env`는 건드리지 않는다.
- 자동 생성된 Wails binding 파일은 빌드 후 변경될 수 있다.
- 커밋 전에는 `.env`가 Git 상태에 잡히지 않는지 반드시 확인한다.
