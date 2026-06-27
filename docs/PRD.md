# Home Shopping Scheduler PRD

## 1. 제품 개요

`Home Shopping Scheduler`는 홈쇼핑 방송 일정을 비개발자가 쉽게 입력하고, 연결된 Google 스프레드시트와 Google 캘린더에 동시에 등록하는 Windows 데스크톱 앱이다.

최종 사용자는 컴퓨터 이해도가 높지 않은 일반 사용자다. 사용자는 API, OAuth, ID, 토큰, 환경변수, 코드 실행 같은 개념을 몰라도 앱을 사용할 수 있어야 한다. 앱은 `exe` 실행 파일로 전달되며, 사용자는 브라우저에서 Google 계정 연결을 허용한 뒤 앱 화면에서 일정을 입력한다.

## 2. 목표

- 홈쇼핑 방송 일정 입력을 단순한 폼 작업으로 만든다.
- 입력한 일정을 Google 스프레드시트에 행으로 저장한다.
- 입력한 일정을 Google 캘린더에 이벤트로 저장한다.
- 사용자가 사용할 스프레드시트와 캘린더를 앱 안에서 선택하거나 새로 만들 수 있게 한다.
- Google 연결은 한 번 완료하면 가능한 한 유지한다.
- 비개발자가 별도 설정 파일, 코드, API 콘솔을 만지지 않게 한다.

## 3. 비목표

- 다중 사용자 서버형 웹 서비스 제공은 목표가 아니다.
- 조직용 관리자 콘솔, 권한 관리, 계정별 역할 관리는 목표가 아니다.
- 방송 시간대, 알림, 반복 일정, 상품 이미지 관리 등은 현재 필수 기능이 아니다.
- 앱 내부 데이터베이스를 별도로 운영하지 않는다.

## 4. 대상 사용자

주 사용자는 홈쇼핑 방송 일정을 반복적으로 기록해야 하는 비개발자다.

사용자 특성:

- Windows PC에서 실행 파일을 더블 클릭해 앱을 실행할 수 있다.
- Google 계정을 사용한다.
- Google Drive, Sheets, Calendar의 세부 API 개념은 모른다.
- “새로 만들기”, “기존 선택”, “등록” 같은 명확한 버튼 중심 UI가 필요하다.
- 앱 안의 안내 문구는 짧고 직접적이어야 한다.

## 5. 핵심 사용자 시나리오

### 5.1 최초 실행

1. 사용자가 `home-shopping-scheduler.exe`를 실행한다.
2. 앱 상단에 Google 계정 연결 상태가 표시된다.
3. 연결 전 상태라면 `Google 계정 연결하기` 버튼이 활성화된다.
4. 사용자가 버튼을 누르면 기본 브라우저가 열리고 Google OAuth 동의 화면이 나타난다.
5. 사용자가 Google 계정을 선택하고 권한을 허용한다.
6. 브라우저에는 연결 완료 안내가 표시되고, 사용자는 앱으로 돌아온다.
7. 앱은 연결된 Google 이메일과 연결 상태를 표시한다.

### 5.2 등록 위치 설정

1. 사용자가 메인 화면의 `등록 위치` 버튼을 누른다.
2. 앱은 연결된 Google 계정의 스프레드시트 목록과 캘린더 목록을 불러온다.
3. 스프레드시트는 `새로 만들기` 또는 `기존 선택` 중 하나를 선택할 수 있다.
4. 캘린더도 `새로 만들기` 또는 `기존 선택` 중 하나를 선택할 수 있다.
5. `새로 만들기`를 선택하면 사용자가 원하는 이름을 입력한다.
6. `기존 선택`을 선택하면 목록에서 사용할 항목을 선택한다.
7. 저장 후 메인 화면 상단에는 연결된 스프레드시트 제목과 캘린더 제목만 표시한다.
8. 사용자는 언제든 다시 `등록 위치`를 열어 선택을 변경할 수 있다.

### 5.3 일정 등록

1. 사용자가 날짜를 선택한다.
2. 사용자가 홈쇼핑 채널을 선택한다.
3. 사용자가 업체를 선택한다.
4. 사용자가 제품명을 입력한다.
5. 사용자가 수량을 선택적으로 입력한다.
6. 앱은 하단 `등록 내용` 영역에 입력 요약을 표시한다.
7. 사용자가 `시트와 캘린더에 등록` 버튼을 누른다.
8. 앱은 Google 연결 상태와 등록 위치 설정 상태를 확인한다.
9. 스프레드시트 설정이 신규라면 새 Google 스프레드시트를 만들고 헤더를 작성한다.
10. 캘린더 설정이 신규라면 새 Google 캘린더를 만든다.
11. 앱은 스프레드시트에 일정 행을 추가한다.
12. 앱은 캘린더에 하루짜리 이벤트를 추가한다.
13. 신규 생성된 시트/캘린더의 ID와 제목은 앱 로컬 설정에 저장된다.
14. 등록 성공 메시지를 보여주고 입력 폼을 초기화한다.

## 6. 화면 구성

### 6.1 메인 화면

메인 화면은 앱 실행 후 바로 보이는 작업 화면이다. 별도 랜딩 페이지 없이 실제 입력 폼이 첫 화면이어야 한다.

구성 요소:

- 헤더
  - 작은 라벨: `홈쇼핑 일정 입력`
  - 제목: `방송 일정 등록`
  - 버튼: `설정`
- Google 연결 패널
  - 상태 배지: `연결 필요` 또는 `연결됨`
  - 제목: 연결 필요/연결 완료 상태 설명
  - 설명: 연결 계정 이메일 또는 연결 필요 안내
  - 버튼: `Google 계정 연결하기` 또는 `다시 연결`
  - 버튼: `연결 확인`
- 등록 위치 요약
  - 스프레드시트 제목
  - 캘린더 제목
  - 버튼: `등록 위치`
- 날짜 입력
  - 이전 날짜 버튼
  - 날짜 선택 input
  - 다음 날짜 버튼
- 일정 입력 폼
  - 홈쇼핑 select
  - 업체 select
  - 제품명 text input
  - 수량 number input
- 등록 내용 요약
  - 예: `2026-06-26 · GS SHOP · 기본 업체 · 제품명 / 3개`
- 액션 버튼
  - `초기화`
  - `시트와 캘린더에 등록`
- 결과 메시지 output

### 6.2 등록 위치 패널

메인 화면 위에 표시되는 설정형 패널이다.

스프레드시트 섹션:

- 설명: `방송 일정이 행으로 추가됩니다.`
- segmented control: `새로 만들기`, `기존 선택`
- 신규 선택 시: 이름 input 활성화
- 기존 선택 시: 기존 스프레드시트 select 활성화

캘린더 섹션:

- 설명: `방송 일정이 이벤트로 등록됩니다.`
- segmented control: `새로 만들기`, `기존 선택`
- 신규 선택 시: 이름 input 활성화
- 기존 선택 시: 기존 캘린더 select 활성화

저장 버튼:

- `등록 위치 저장`

### 6.3 관리 설정 패널

채널/업체 목록을 관리하는 패널이다.

구성 요소:

- 홈쇼핑 목록 textarea
- 업체 목록 textarea
- Google 연결 안내
- `설정 저장` 버튼

## 7. 기능 요구사항

### 7.1 Google OAuth 연결

- 앱에 빌드 시 Google OAuth Client ID와 Client Secret을 포함할 수 있어야 한다.
- OAuth 클라이언트는 Desktop 앱 유형을 전제로 한다.
- 앱은 로컬 루프백 callback 서버를 열어 OAuth 인증 코드를 받는다.
- PKCE를 사용한다.
- 인증 완료 후 토큰과 이메일을 로컬 사용자 설정 디렉토리에 저장한다.
- 앱 재실행 후에도 저장된 refresh token을 이용해 연결 상태를 유지한다.
- 연결 상태 확인 기능을 제공한다.

필요 Google OAuth scope:

- `https://www.googleapis.com/auth/spreadsheets`
- `https://www.googleapis.com/auth/calendar`
- `https://www.googleapis.com/auth/drive.metadata.readonly`
- `https://www.googleapis.com/auth/userinfo.email`

신규 스프레드시트 생성을 위해 Sheets API의 spreadsheet create 기능을 사용한다. 기존 파일 목록 조회는 Drive API를 사용한다.

### 7.2 기존 리소스 목록 조회

스프레드시트 목록:

- Google Drive API `Files.List`를 사용한다.
- 조건: Google Spreadsheet mime type, 휴지통 제외.
- 최대 100개까지 불러온다.
- 최신 수정 순서로 정렬한다.
- UI에는 제목만 표시하고 내부적으로 ID를 저장한다.

캘린더 목록:

- Google Calendar API `CalendarList.List`를 사용한다.
- 쓰기 가능한 캘린더만 표시한다.
- UI에는 summary만 표시하고 내부적으로 ID를 저장한다.

### 7.3 신규 리소스 생성

신규 스프레드시트:

- 사용자가 입력한 이름으로 Google 스프레드시트를 생성한다.
- 이름이 비어 있으면 기본값 `홈쇼핑 방송 일정`을 사용한다.
- 생성 직후 첫 행에 헤더를 작성한다.

헤더:

```text
날짜 | 홈쇼핑 | 업체 | 제품 | 수량 | 등록일시
```

신규 캘린더:

- 사용자가 입력한 이름으로 Google 캘린더를 생성한다.
- 이름이 비어 있으면 기본값 `홈쇼핑 방송 일정`을 사용한다.
- 시간대는 `Asia/Seoul`을 사용한다.

### 7.4 일정 등록

스프레드시트 행 추가:

- 범위: `A:F`
- 입력 방식: `USER_ENTERED`
- 행 삽입 방식: `INSERT_ROWS`
- 추가 데이터:
  - 날짜
  - 홈쇼핑
  - 업체
  - 제품
  - 수량
  - 등록일시

캘린더 이벤트 추가:

- 하루짜리 종일 이벤트로 생성한다.
- 이벤트 제목 형식: `[홈쇼핑] 제품`
- 이벤트 설명:

```text
업체: {업체}
제품: {제품}
수량: {수량}
```

수량이 없으면 수량 줄은 생략한다.

### 7.5 로컬 설정 저장

프론트엔드 localStorage에 다음 설정을 저장한다.

- 홈쇼핑 목록
- 업체 목록
- 선택된 스프레드시트
  - mode: `new` 또는 `existing`
  - id
  - title
- 선택된 캘린더
  - mode: `new` 또는 `existing`
  - id
  - title

Google OAuth token은 localStorage가 아니라 OS 사용자 설정 디렉토리의 JSON 파일로 저장한다.

## 8. 데이터 모델

### 8.1 SchedulePayload

```json
{
  "date": "2026-06-26",
  "channel": "GS SHOP",
  "vendor": "기본 업체",
  "product": "제품명",
  "quantity": "3",
  "spreadsheet": {
    "mode": "existing",
    "id": "spreadsheet-id",
    "title": "홈쇼핑 방송 일정"
  },
  "calendar": {
    "mode": "existing",
    "id": "calendar-id",
    "title": "홈쇼핑 방송 일정"
  }
}
```

### 8.2 GoogleResourceOption

```json
{
  "id": "google-resource-id",
  "title": "사용자에게 표시할 제목"
}
```

### 8.3 GoogleConnectionStatus

```json
{
  "configured": true,
  "connected": true,
  "email": "user@example.com",
  "message": "Google 계정이 연결되어 있습니다."
}
```

## 9. 기술 요구사항

- 앱 프레임워크: Wails v2
- 백엔드: Go 1.26
- 프론트엔드: Vite, vanilla JavaScript, CSS
- 패키지 매니저: npm
- 빌드 환경: Docker Compose
- 배포 대상: Windows `.exe`
- 개발 주 환경: WSL + Docker

주요 Go 패키지:

- `github.com/wailsapp/wails/v2`
- `golang.org/x/oauth2`
- `google.golang.org/api/drive/v3`
- `google.golang.org/api/sheets/v4`
- `google.golang.org/api/calendar/v3`
- `google.golang.org/api/option`

## 10. 빌드 요구사항

호스트 PC에는 Go, Node, Wails를 직접 설치하지 않아도 된다.

기본 빌드:

```bash
docker compose build
docker compose run --rm wails
```

빌드 결과:

```text
build/bin/home-shopping-scheduler.exe
```

OAuth 값은 `.env` 또는 환경변수로 주입한다.

```text
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
```

`.env`는 Git에 커밋하지 않는다.

## 11. UX 원칙

- 사용자는 ID, 토큰, API 키, scope 같은 용어를 보지 않아야 한다.
- 첫 화면은 실제 입력 화면이어야 한다.
- 설정은 필요할 때만 열리는 보조 패널로 둔다.
- 연결된 스프레드시트/캘린더는 제목만 보여준다.
- 실패 메시지는 원인을 짧게 설명하고 사용자가 다음 행동을 알 수 있게 한다.
- 폼 입력 중 등록될 내용을 즉시 요약해서 보여준다.
- 모바일 웹이 아니라 Windows 데스크톱 앱이지만, 좁은 창에서도 화면이 깨지지 않아야 한다.

## 12. 오류 처리 요구사항

- Google OAuth 설정이 앱에 포함되지 않았으면 연결 버튼을 비활성화한다.
- Google 계정이 연결되지 않았으면 목록 조회와 일정 등록을 막는다.
- 제품명이 비어 있으면 등록을 막고 제품명 입력란에 focus한다.
- 등록 위치가 설정되지 않았으면 등록을 막는다.
- 기존 선택 모드에서 항목을 고르지 않았으면 저장을 막는다.
- Google API 호출 실패 시 사용자에게 짧은 오류 메시지를 보여준다.
- token refresh 실패 시 사용자가 다시 Google 계정을 연결할 수 있어야 한다.

## 13. 현재 구현 상태

구현 완료:

- Wails 기반 Windows exe 빌드
- Docker Compose 빌드 환경
- Google OAuth 연결
- OAuth token 로컬 저장
- Google 연결 상태 표시
- 홈쇼핑/업체 목록 관리
- 등록 위치 패널
- 기존 스프레드시트 목록 조회
- 기존 캘린더 목록 조회
- 신규 스프레드시트 생성
- 신규 캘린더 생성
- 시트 행 추가
- 캘린더 이벤트 추가

개선 후보:

- 실제 방송 시간 입력 기능
- 등록 전 미리보기/확인 모달
- 등록 실패 시 상세 원인 표시
- Google 연결 해제 버튼 UI 노출
- 선택한 기존 시트에 헤더가 없을 때 자동 헤더 보정
- 등록 완료 후 생성된 시트/캘린더로 바로 열기 버튼
- 디자인 재정비

## 14. 수용 기준

- 사용자는 exe 실행 후 Google 계정을 연결할 수 있다.
- 연결된 계정 이메일이 앱에 표시된다.
- 등록 위치 패널에서 기존 스프레드시트 목록이 보인다.
- 등록 위치 패널에서 기존 캘린더 목록이 보인다.
- 신규 스프레드시트 이름을 입력하고 일정을 등록하면 Google Drive에 해당 시트가 생성된다.
- 신규 캘린더 이름을 입력하고 일정을 등록하면 Google Calendar에 해당 캘린더가 생성된다.
- 일정 등록 시 시트에 한 행이 추가된다.
- 일정 등록 시 캘린더에 이벤트가 추가된다.
- 앱을 재실행해도 Google 연결과 등록 위치 설정이 유지된다.
- Google OAuth Client ID/Secret은 Git 저장소에 커밋되지 않는다.
