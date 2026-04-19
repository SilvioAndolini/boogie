package handler

import (
	"net/http"

	sentrysdk "github.com/getsentry/sentry-go"
)

func SentryMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		hub := sentrysdk.GetHubFromContext(r.Context())
		if hub == nil {
			hub = sentrysdk.CurrentHub().Clone()
		}

		hub.Scope().SetTag("http.method", r.Method)
		hub.Scope().SetTag("http.url", r.URL.Path)
		hub.Scope().SetTag("http.user_agent", r.UserAgent())
		hub.Scope().SetTag("remote_addr", r.RemoteAddr)

		ctx := sentrysdk.SetHubOnContext(r.Context(), hub)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
