package main

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"golang.org/x/oauth2"
	calendar "google.golang.org/api/calendar/v3"
	"google.golang.org/api/drive/v3"
	"google.golang.org/api/googleapi"
	"google.golang.org/api/option"
	"google.golang.org/api/sheets/v4"
)

type GoogleResourceOption struct {
	ID    string `json:"id"`
	Title string `json:"title"`
}

type GoogleDestinationOptions struct {
	OK           bool                   `json:"ok"`
	Message      string                 `json:"message"`
	Spreadsheets []GoogleResourceOption `json:"spreadsheets"`
	Calendars    []GoogleResourceOption `json:"calendars"`
}

type GoogleDriveFolderContent struct {
	OK           bool                   `json:"ok"`
	Message      string                 `json:"message"`
	ParentID     string                 `json:"parentID"`
	Folders      []GoogleResourceOption `json:"folders"`
	Spreadsheets []GoogleResourceOption `json:"spreadsheets"`
}

type GoogleResourceSelection struct {
	Mode        string `json:"mode"`
	ID          string `json:"id"`
	Title       string `json:"title"`
	FolderID    string `json:"folderID"`
	FolderTitle string `json:"folderTitle"`
}

type SchedulePayload struct {
	Date            string                  `json:"date"`
	Time            string                  `json:"time"`
	Channel         string                  `json:"channel"`
	Vendor          string                  `json:"vendor"`
	CalendarChannel string                  `json:"calendarChannel"`
	CalendarVendor  string                  `json:"calendarVendor"`
	Product         string                  `json:"product"`
	Quantity        string                  `json:"quantity"`
	Spreadsheet     GoogleResourceSelection `json:"spreadsheet"`
	Calendar        GoogleResourceSelection `json:"calendar"`
}

type ScheduleSubmitResult struct {
	OK          bool                    `json:"ok"`
	Message     string                  `json:"message"`
	Spreadsheet GoogleResourceSelection `json:"spreadsheet"`
	Calendar    GoogleResourceSelection `json:"calendar"`
}

func (a *App) ListGoogleDestinations() GoogleDestinationOptions {
	ctx := appContext(a.ctx)
	client, err := authorizedGoogleHTTPClient(ctx)
	if err != nil {
		return GoogleDestinationOptions{
			OK:      false,
			Message: googleAuthErrorMessage(err),
		}
	}

	spreadsheets, err := listSpreadsheets(ctx, client)
	if err != nil {
		return GoogleDestinationOptions{
			OK:      false,
			Message: fmt.Sprintf("스프레드시트 목록을 불러오지 못했습니다. %s", googleAPIErrorMessage(err)),
		}
	}

	calendars, err := listCalendars(ctx, client)
	if err != nil {
		return GoogleDestinationOptions{
			OK:      false,
			Message: fmt.Sprintf("캘린더 목록을 불러오지 못했습니다. %s", googleAPIErrorMessage(err)),
		}
	}

	return GoogleDestinationOptions{
		OK:           true,
		Message:      "등록 위치 목록을 불러왔습니다.",
		Spreadsheets: spreadsheets,
		Calendars:    calendars,
	}
}

func (a *App) ListGoogleDriveFolder(parentID string) GoogleDriveFolderContent {
	ctx := appContext(a.ctx)
	client, err := authorizedGoogleHTTPClient(ctx)
	if err != nil {
		return GoogleDriveFolderContent{
			OK:      false,
			Message: googleAuthErrorMessage(err),
		}
	}

	content, err := listDriveFolderContent(ctx, client, parentID)
	if err != nil {
		return GoogleDriveFolderContent{
			OK:       false,
			Message:  fmt.Sprintf("Google Drive 폴더 내용을 불러오지 못했습니다. %s", googleAPIErrorMessage(err)),
			ParentID: parentID,
		}
	}

	content.OK = true
	content.Message = "Google Drive 폴더 내용을 불러왔습니다."
	return content
}

func (a *App) SubmitSchedule(payload SchedulePayload) ScheduleSubmitResult {
	ctx := appContext(a.ctx)
	client, err := authorizedGoogleHTTPClient(ctx)
	if err != nil {
		return ScheduleSubmitResult{
			OK:      false,
			Message: googleAuthErrorMessage(err),
		}
	}

	if strings.TrimSpace(payload.Channel) == "" {
		return ScheduleSubmitResult{
			OK:      false,
			Message: "홈쇼핑이 비어 있어 등록할 수 없습니다. 설정에서 홈쇼핑 목록을 확인해 주세요.",
		}
	}

	if strings.TrimSpace(payload.Vendor) == "" {
		return ScheduleSubmitResult{
			OK:      false,
			Message: "업체가 비어 있어 등록할 수 없습니다. 설정에서 업체 목록을 확인해 주세요.",
		}
	}

	if strings.TrimSpace(payload.Product) == "" {
		return ScheduleSubmitResult{
			OK:      false,
			Message: "제품명을 입력해야 등록할 수 있습니다.",
		}
	}

	if _, err := time.Parse("2006-01-02", payload.Date); err != nil {
		return ScheduleSubmitResult{
			OK:      false,
			Message: "날짜 형식이 올바르지 않습니다. 날짜를 다시 선택해 주세요.",
		}
	}

	spreadsheet, err := ensureSpreadsheet(ctx, client, payload.Spreadsheet)
	if err != nil {
		return ScheduleSubmitResult{
			OK:      false,
			Message: fmt.Sprintf("스프레드시트를 준비하지 못했습니다. %s", err.Error()),
		}
	}

	calendarTarget, err := ensureCalendar(ctx, client, payload.Calendar)
	if err != nil {
		return ScheduleSubmitResult{
			OK:      false,
			Message: fmt.Sprintf("캘린더를 준비하지 못했습니다. %s", err.Error()),
		}
	}

	if err := appendScheduleRow(ctx, client, spreadsheet.ID, payload); err != nil {
		return ScheduleSubmitResult{
			OK:      false,
			Message: fmt.Sprintf("스프레드시트에 일정을 추가하지 못했습니다. 캘린더에는 아직 등록하지 않았습니다. %s", googleAPIErrorMessage(err)),
		}
	}

	if err := insertCalendarEvent(ctx, client, calendarTarget.ID, payload); err != nil {
		return ScheduleSubmitResult{
			OK:      false,
			Message: fmt.Sprintf("스프레드시트에는 추가됐지만 캘린더 등록에 실패했습니다. 같은 일정을 다시 등록하면 시트에 중복 행이 생길 수 있습니다. %s", googleAPIErrorMessage(err)),
		}
	}

	return ScheduleSubmitResult{
		OK:          true,
		Message:     "시트와 캘린더에 등록했습니다.",
		Spreadsheet: spreadsheet,
		Calendar:    calendarTarget,
	}
}

func appContext(ctx context.Context) context.Context {
	if ctx != nil {
		return ctx
	}
	return context.Background()
}

func googleAuthErrorMessage(err error) string {
	if err == nil {
		return "Google 계정을 먼저 연결해 주세요."
	}
	return fmt.Sprintf("Google 계정 연결이 필요합니다. 메인 화면에서 Google 계정을 다시 연결해 주세요. 상세: %s", err.Error())
}

func googleAPIErrorMessage(err error) string {
	if err == nil {
		return "잠시 후 다시 시도해 주세요."
	}

	if apiErr, ok := err.(*googleapi.Error); ok {
		switch apiErr.Code {
		case http.StatusUnauthorized:
			return "Google 인증이 만료되었거나 권한이 취소되었습니다. 메인 화면에서 Google 계정을 다시 연결해 주세요."
		case http.StatusForbidden:
			return "선택한 Google 파일이나 캘린더에 쓰기 권한이 없거나 필요한 API 권한이 허용되지 않았습니다. 등록 위치 권한을 확인한 뒤 Google 계정을 다시 연결해 주세요."
		case http.StatusNotFound:
			return "선택한 스프레드시트, 폴더, 또는 캘린더를 찾지 못했습니다. 등록 위치를 다시 선택해 주세요."
		case http.StatusTooManyRequests:
			return "Google 요청 한도를 잠시 초과했습니다. 몇 분 뒤 다시 시도해 주세요."
		case http.StatusBadRequest:
			if strings.TrimSpace(apiErr.Message) != "" {
				return fmt.Sprintf("Google에 보낸 요청 형식이 올바르지 않습니다. 등록 위치를 다시 저장해 주세요. 상세: %s", apiErr.Message)
			}
			return "Google에 보낸 요청 형식이 올바르지 않습니다. 등록 위치를 다시 저장해 주세요."
		default:
			if apiErr.Code >= 500 {
				return "Google 서버에서 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
			}
			if strings.TrimSpace(apiErr.Message) != "" {
				return fmt.Sprintf("Google 오류가 발생했습니다. 상세: %s", apiErr.Message)
			}
		}
	}

	return fmt.Sprintf("상세: %s", err.Error())
}

func authorizedGoogleHTTPClient(ctx context.Context) (*http.Client, error) {
	store, err := loadGoogleAuthStore()
	if err != nil {
		return nil, err
	}
	if store.Token == nil {
		return nil, fmt.Errorf("missing google token")
	}

	config := googleOAuthConfig("")
	tokenSource := config.TokenSource(ctx, store.Token)
	token, err := tokenSource.Token()
	if err != nil {
		return nil, err
	}

	if token.AccessToken != store.Token.AccessToken || token.RefreshToken != store.Token.RefreshToken || token.Expiry != store.Token.Expiry {
		store.Token = token
		_ = saveGoogleAuthStore(store)
	}

	return oauth2.NewClient(ctx, oauth2.StaticTokenSource(token)), nil
}

func listSpreadsheets(ctx context.Context, client *http.Client) ([]GoogleResourceOption, error) {
	service, err := drive.NewService(ctx, option.WithHTTPClient(client))
	if err != nil {
		return nil, err
	}

	response, err := service.Files.List().
		Q("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false").
		Fields("files(id,name)").
		OrderBy("modifiedTime desc").
		PageSize(100).
		Do()
	if err != nil {
		return nil, err
	}

	options := make([]GoogleResourceOption, 0, len(response.Files))
	for _, file := range response.Files {
		options = append(options, GoogleResourceOption{
			ID:    file.Id,
			Title: file.Name,
		})
	}
	return options, nil
}

func listDriveFolderContent(ctx context.Context, client *http.Client, parentID string) (GoogleDriveFolderContent, error) {
	service, err := drive.NewService(ctx, option.WithHTTPClient(client))
	if err != nil {
		return GoogleDriveFolderContent{}, err
	}

	if strings.TrimSpace(parentID) == "" {
		parentID = "root"
	}

	query := fmt.Sprintf(
		"'%s' in parents and trashed=false and (mimeType='application/vnd.google-apps.folder' or mimeType='application/vnd.google-apps.spreadsheet')",
		escapeDriveQueryValue(parentID),
	)
	response, err := service.Files.List().
		Q(query).
		Fields("files(id,name,mimeType)").
		OrderBy("folder,name").
		PageSize(100).
		Do()
	if err != nil {
		return GoogleDriveFolderContent{}, err
	}

	content := GoogleDriveFolderContent{
		ParentID:     parentID,
		Folders:      []GoogleResourceOption{},
		Spreadsheets: []GoogleResourceOption{},
	}
	for _, file := range response.Files {
		option := GoogleResourceOption{
			ID:    file.Id,
			Title: file.Name,
		}
		if file.MimeType == "application/vnd.google-apps.folder" {
			content.Folders = append(content.Folders, option)
			continue
		}
		content.Spreadsheets = append(content.Spreadsheets, option)
	}
	return content, nil
}

func escapeDriveQueryValue(value string) string {
	return strings.ReplaceAll(value, "'", "\\'")
}

func listCalendars(ctx context.Context, client *http.Client) ([]GoogleResourceOption, error) {
	service, err := calendar.NewService(ctx, option.WithHTTPClient(client))
	if err != nil {
		return nil, err
	}

	response, err := service.CalendarList.List().
		Fields("items(id,summary)").
		ShowHidden(false).
		MinAccessRole("writer").
		Do()
	if err != nil {
		return nil, err
	}

	options := make([]GoogleResourceOption, 0, len(response.Items))
	for _, item := range response.Items {
		options = append(options, GoogleResourceOption{
			ID:    item.Id,
			Title: item.Summary,
		})
	}
	return options, nil
}

func ensureSpreadsheet(ctx context.Context, client *http.Client, selection GoogleResourceSelection) (GoogleResourceSelection, error) {
	if selection.Mode == "existing" {
		if strings.TrimSpace(selection.ID) == "" {
			return GoogleResourceSelection{}, fmt.Errorf("기존 스프레드시트를 선택했지만 저장된 ID가 없습니다. 등록 위치에서 스프레드시트를 다시 선택해 주세요")
		}
		return selection, nil
	}

	title := strings.TrimSpace(selection.Title)
	if title == "" {
		title = "홈쇼핑 방송 일정"
	}

	folderID := normalizeDriveFolderID(selection.FolderID)
	folderTitle := normalizeDriveFolderTitle(folderID, selection.FolderTitle)
	created, err := createSpreadsheetFile(ctx, client, title, folderID)
	if err != nil {
		return GoogleResourceSelection{}, fmt.Errorf("새 스프레드시트 '%s'을 만들지 못했습니다. %s", title, googleAPIErrorMessage(err))
	}

	service, err := sheets.NewService(ctx, option.WithHTTPClient(client))
	if err != nil {
		return GoogleResourceSelection{}, fmt.Errorf("Google Sheets 연결을 준비하지 못했습니다. %s", err.Error())
	}
	if err := writeSpreadsheetHeader(service, created.ID); err != nil {
		return GoogleResourceSelection{}, fmt.Errorf("새로 만든 스프레드시트 '%s'의 헤더를 작성하지 못했습니다. %s", title, googleAPIErrorMessage(err))
	}

	return GoogleResourceSelection{
		Mode:        "existing",
		ID:          created.ID,
		Title:       title,
		FolderID:    folderID,
		FolderTitle: folderTitle,
	}, nil
}

func createSpreadsheetFile(ctx context.Context, client *http.Client, title string, folderID string) (GoogleResourceOption, error) {
	service, err := drive.NewService(ctx, option.WithHTTPClient(client))
	if err != nil {
		return GoogleResourceOption{}, err
	}

	file := &drive.File{
		Name:     title,
		MimeType: "application/vnd.google-apps.spreadsheet",
	}
	if folderID != "root" {
		file.Parents = []string{folderID}
	}

	created, err := service.Files.Create(file).Fields("id,name").Do()
	if err != nil {
		return GoogleResourceOption{}, err
	}

	return GoogleResourceOption{
		ID:    created.Id,
		Title: created.Name,
	}, nil
}

func normalizeDriveFolderID(folderID string) string {
	folderID = strings.TrimSpace(folderID)
	if folderID == "" {
		return "root"
	}
	return folderID
}

func normalizeDriveFolderTitle(folderID string, folderTitle string) string {
	folderTitle = strings.TrimSpace(folderTitle)
	if folderTitle != "" {
		return folderTitle
	}
	if folderID == "root" {
		return "내 드라이브"
	}
	return "선택한 폴더"
}

func writeSpreadsheetHeader(service *sheets.Service, spreadsheetID string) error {
	_, err := service.Spreadsheets.Values.Update(spreadsheetID, "A1:G1", &sheets.ValueRange{
		Values: [][]interface{}{{
			"날짜",
			"방송시간",
			"홈쇼핑",
			"업체",
			"제품",
			"수량",
			"등록일시",
		}},
	}).ValueInputOption("RAW").Do()
	return err
}

func ensureCalendar(ctx context.Context, client *http.Client, selection GoogleResourceSelection) (GoogleResourceSelection, error) {
	if selection.Mode == "existing" {
		if strings.TrimSpace(selection.ID) == "" {
			return GoogleResourceSelection{}, fmt.Errorf("기존 캘린더를 선택했지만 저장된 ID가 없습니다. 등록 위치에서 캘린더를 다시 선택해 주세요")
		}
		return selection, nil
	}

	title := strings.TrimSpace(selection.Title)
	if title == "" {
		title = "홈쇼핑 방송 일정"
	}

	service, err := calendar.NewService(ctx, option.WithHTTPClient(client))
	if err != nil {
		return GoogleResourceSelection{}, fmt.Errorf("Google Calendar 연결을 준비하지 못했습니다. %s", err.Error())
	}

	created, err := service.Calendars.Insert(&calendar.Calendar{
		Summary:  title,
		TimeZone: "Asia/Seoul",
	}).Do()
	if err != nil {
		return GoogleResourceSelection{}, fmt.Errorf("새 캘린더 '%s'을 만들지 못했습니다. %s", title, googleAPIErrorMessage(err))
	}

	return GoogleResourceSelection{
		Mode:  "existing",
		ID:    created.Id,
		Title: title,
	}, nil
}

func appendScheduleRow(ctx context.Context, client *http.Client, spreadsheetID string, payload SchedulePayload) error {
	service, err := sheets.NewService(ctx, option.WithHTTPClient(client))
	if err != nil {
		return err
	}

	_, err = service.Spreadsheets.Values.Append(spreadsheetID, "A:G", &sheets.ValueRange{
		Values: [][]interface{}{{
			payload.Date,
			payload.Time,
			payload.Channel,
			payload.Vendor,
			payload.Product,
			payload.Quantity,
			time.Now().In(time.FixedZone("KST", 9*60*60)).Format("2006-01-02 15:04:05"),
		}},
	}).ValueInputOption("USER_ENTERED").InsertDataOption("INSERT_ROWS").Do()
	return err
}

func insertCalendarEvent(ctx context.Context, client *http.Client, calendarID string, payload SchedulePayload) error {
	service, err := calendar.NewService(ctx, option.WithHTTPClient(client))
	if err != nil {
		return err
	}

	startDate, err := time.Parse("2006-01-02", payload.Date)
	if err != nil {
		return err
	}
	endDate := startDate.AddDate(0, 0, 1)
	quantityText := ""
	if strings.TrimSpace(payload.Quantity) != "" {
		quantityText = fmt.Sprintf("\n수량: %s", payload.Quantity)
	}
	timeText := ""
	if strings.TrimSpace(payload.Time) != "" {
		timeText = fmt.Sprintf("%s ", payload.Time)
	}
	calendarChannel := strings.TrimSpace(payload.CalendarChannel)
	if calendarChannel == "" {
		calendarChannel = payload.Channel
	}
	calendarVendor := strings.TrimSpace(payload.CalendarVendor)
	if calendarVendor == "" {
		calendarVendor = payload.Vendor
	}

	_, err = service.Events.Insert(calendarID, &calendar.Event{
		Summary: fmt.Sprintf("[%s_%s] %s%s", calendarChannel, calendarVendor, timeText, payload.Product),
		Description: fmt.Sprintf(
			"업체: %s\n제품: %s%s",
			payload.Vendor,
			payload.Product,
			quantityText,
		),
		Start: &calendar.EventDateTime{
			Date: startDate.Format("2006-01-02"),
		},
		End: &calendar.EventDateTime{
			Date: endDate.Format("2006-01-02"),
		},
	}).Do()
	return err
}
