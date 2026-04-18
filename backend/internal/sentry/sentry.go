package sentry

import (
	"log/slog"
	"time"

	sentrysdk "github.com/getsentry/sentry-go"
)

func Init(dsn, env string) {
	if dsn == "" {
		slog.Info("[sentry] DSN not set, skipping initialization")
		return
	}

	err := sentrysdk.Init(sentrysdk.ClientOptions{
		Dsn:              dsn,
		Environment:      env,
		Release:          "boogie-backend@" + time.Now().Format("2006-01-02"),
		TracesSampleRate: 0.1,
		AttachStacktrace: true,
	})
	if err != nil {
		slog.Error("[sentry] init failed", "error", err)
		return
	}

	slog.Info("[sentry] initialized", "env", env)
}

func Flush() {
	sentrysdk.Flush(5 * time.Second)
}

func CaptureException(err error) {
	sentrysdk.CaptureException(err)
}

func Recover() {
	sentrysdk.Recover()
}

func SetTag(key, value string) {
	sentrysdk.ConfigureScope(func(scope *sentrysdk.Scope) {
		scope.SetTag(key, value)
	})
}
