package main

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"time"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

type GoogleConnectionStatus struct {
	Configured bool   `json:"configured"`
	Connected  bool   `json:"connected"`
	Email      string `json:"email"`
	Message    string `json:"message"`
}

type googleAuthStore struct {
	Email string        `json:"email"`
	Token *oauth2.Token `json:"token"`
}

type App struct {
	ctx context.Context
}

var (
	googleOAuthClientID     string
	googleOAuthClientSecret string
)

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) GetGoogleConnectionStatus() GoogleConnectionStatus {
	if googleClientID() == "" {
		return GoogleConnectionStatus{
			Configured: false,
			Connected:  false,
			Message:    "Google 연결 설정이 아직 앱에 포함되지 않았습니다.",
		}
	}

	store, err := loadGoogleAuthStore()
	if err == nil && store.Token != nil && (store.Token.Valid() || store.Token.RefreshToken != "") {
		return GoogleConnectionStatus{
			Configured: true,
			Connected:  true,
			Email:      store.Email,
			Message:    "Google 계정이 연결되어 있습니다.",
		}
	}

	return GoogleConnectionStatus{
		Configured: true,
		Connected:  false,
		Message:    "Google 계정 연결이 필요합니다.",
	}
}

func (a *App) StartGoogleConnect() GoogleConnectionStatus {
	status := a.GetGoogleConnectionStatus()
	if !status.Configured {
		return status
	}

	store, err := runGoogleOAuth(a.ctx)
	if err != nil {
		return GoogleConnectionStatus{
			Configured: true,
			Connected:  false,
			Message:    "Google 계정 연결에 실패했습니다. 다시 시도해 주세요.",
		}
	}

	if err := saveGoogleAuthStore(store); err != nil {
		return GoogleConnectionStatus{
			Configured: true,
			Connected:  false,
			Message:    "Google 계정 연결 정보를 저장하지 못했습니다.",
		}
	}

	return GoogleConnectionStatus{
		Configured: true,
		Connected:  true,
		Email:      store.Email,
		Message:    "Google 계정 연결이 완료되었습니다.",
	}
}

func (a *App) DisconnectGoogle() GoogleConnectionStatus {
	if err := deleteGoogleAuthStore(); err != nil {
		return GoogleConnectionStatus{
			Configured: googleClientID() != "",
			Connected:  false,
			Message:    "Google 계정 연결 해제에 실패했습니다.",
		}
	}

	return GoogleConnectionStatus{
		Configured: googleClientID() != "",
		Connected:  false,
		Message:    "Google 계정 연결을 해제했습니다.",
	}
}

func googleClientID() string {
	if googleOAuthClientID != "" {
		return googleOAuthClientID
	}
	return os.Getenv("GOOGLE_OAUTH_CLIENT_ID")
}

func googleClientSecret() string {
	if googleOAuthClientSecret != "" {
		return googleOAuthClientSecret
	}
	return os.Getenv("GOOGLE_OAUTH_CLIENT_SECRET")
}

func googleOAuthConfig(redirectURL string) *oauth2.Config {
	return &oauth2.Config{
		ClientID:     googleClientID(),
		ClientSecret: googleClientSecret(),
		RedirectURL:  redirectURL,
		Scopes: []string{
			"https://www.googleapis.com/auth/spreadsheets",
			"https://www.googleapis.com/auth/calendar",
			"https://www.googleapis.com/auth/drive.file",
			"https://www.googleapis.com/auth/drive.metadata.readonly",
			"https://www.googleapis.com/auth/userinfo.email",
		},
		Endpoint: google.Endpoint,
	}
}

func runGoogleOAuth(ctx context.Context) (googleAuthStore, error) {
	if ctx == nil {
		ctx = context.Background()
	}

	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return googleAuthStore{}, err
	}
	defer listener.Close()

	redirectURL := fmt.Sprintf("http://%s/google/oauth/callback", listener.Addr().String())
	config := googleOAuthConfig(redirectURL)
	state, err := randomString(32)
	if err != nil {
		return googleAuthStore{}, err
	}

	verifier := oauth2.GenerateVerifier()
	codeCh := make(chan string, 1)
	errCh := make(chan error, 1)

	server := &http.Server{
		ReadHeaderTimeout: 5 * time.Second,
	}

	server.Handler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/google/oauth/callback" {
			http.NotFound(w, r)
			return
		}

		if r.URL.Query().Get("state") != state {
			errCh <- errors.New("invalid oauth state")
			writeOAuthHTML(w, "연결에 실패했습니다", "앱으로 돌아가 다시 시도해 주세요.")
			return
		}

		if oauthErr := r.URL.Query().Get("error"); oauthErr != "" {
			errCh <- fmt.Errorf("google oauth error: %s", oauthErr)
			writeOAuthHTML(w, "연결이 취소되었습니다", "앱으로 돌아가 다시 시도할 수 있습니다.")
			return
		}

		code := r.URL.Query().Get("code")
		if code == "" {
			errCh <- errors.New("missing oauth code")
			writeOAuthHTML(w, "연결에 실패했습니다", "Google 인증 결과를 받지 못했습니다.")
			return
		}

		codeCh <- code
		writeOAuthHTML(w, "연결이 완료되었습니다", "이 창을 닫고 앱으로 돌아가 주세요.")
	})

	go func() {
		if serveErr := server.Serve(listener); serveErr != nil && !errors.Is(serveErr, http.ErrServerClosed) {
			errCh <- serveErr
		}
	}()
	defer server.Shutdown(context.Background())

	authURL := config.AuthCodeURL(
		state,
		oauth2.AccessTypeOffline,
		oauth2.ApprovalForce,
		oauth2.S256ChallengeOption(verifier),
	)

	wailsruntime.BrowserOpenURL(ctx, authURL)

	waitCtx, cancel := context.WithTimeout(ctx, 3*time.Minute)
	defer cancel()

	var code string
	select {
	case code = <-codeCh:
	case err := <-errCh:
		return googleAuthStore{}, err
	case <-waitCtx.Done():
		return googleAuthStore{}, waitCtx.Err()
	}

	token, err := config.Exchange(waitCtx, code, oauth2.VerifierOption(verifier))
	if err != nil {
		return googleAuthStore{}, err
	}

	email, err := fetchGoogleEmail(waitCtx, config, token)
	if err != nil {
		return googleAuthStore{}, err
	}

	return googleAuthStore{
		Email: email,
		Token: token,
	}, nil
}

func fetchGoogleEmail(ctx context.Context, config *oauth2.Config, token *oauth2.Token) (string, error) {
	client := config.Client(ctx, token)
	response, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		return "", err
	}
	defer response.Body.Close()

	if response.StatusCode < http.StatusOK || response.StatusCode >= http.StatusMultipleChoices {
		return "", fmt.Errorf("userinfo returned HTTP %d", response.StatusCode)
	}

	body, err := io.ReadAll(response.Body)
	if err != nil {
		return "", err
	}

	var payload struct {
		Email string `json:"email"`
	}
	if err := json.Unmarshal(body, &payload); err != nil {
		return "", err
	}
	if payload.Email == "" {
		return "연결된 Google 계정", nil
	}
	return payload.Email, nil
}

func googleAuthStorePath() (string, error) {
	configDir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(configDir, "Home Shopping Scheduler", "google_auth.json"), nil
}

func loadGoogleAuthStore() (googleAuthStore, error) {
	path, err := googleAuthStorePath()
	if err != nil {
		return googleAuthStore{}, err
	}

	data, err := os.ReadFile(path)
	if err != nil {
		return googleAuthStore{}, err
	}

	var store googleAuthStore
	if err := json.Unmarshal(data, &store); err != nil {
		return googleAuthStore{}, err
	}
	return store, nil
}

func saveGoogleAuthStore(store googleAuthStore) error {
	path, err := googleAuthStorePath()
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(path), 0700); err != nil {
		return err
	}

	data, err := json.MarshalIndent(store, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0600)
}

func deleteGoogleAuthStore() error {
	path, err := googleAuthStorePath()
	if err != nil {
		return err
	}
	if err := os.Remove(path); err != nil && !errors.Is(err, os.ErrNotExist) {
		return err
	}
	return nil
}

func randomString(byteCount int) (string, error) {
	buffer := make([]byte, byteCount)
	if _, err := rand.Read(buffer); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(buffer), nil
}

func writeOAuthHTML(w http.ResponseWriter, title string, message string) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	fmt.Fprintf(w, `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <title>%s</title>
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; background: #f2f5f7; color: #17212b; }
    main { min-height: 100vh; display: grid; place-items: center; padding: 24px; }
    section { max-width: 440px; padding: 28px; background: #fff; border: 1px solid #dce3ea; border-radius: 8px; box-shadow: 0 18px 48px rgba(24, 35, 47, .12); }
    h1 { margin: 0 0 10px; font-size: 24px; }
    p { margin: 0; color: #53606d; line-height: 1.5; }
  </style>
</head>
<body>
  <main>
    <section>
      <h1>%s</h1>
      <p>%s</p>
    </section>
  </main>
</body>
</html>`, title, title, message)
}
