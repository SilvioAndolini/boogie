package metrics

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	HttpRequestsTotal = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "http_requests_total",
		Help: "Total HTTP requests",
	}, []string{"method", "path", "status"})

	HttpRequestDuration = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Name:    "http_request_duration_seconds",
		Help:    "HTTP request duration in seconds",
		Buckets: prometheus.DefBuckets,
	}, []string{"method", "path"})

	HttpRequestsInFlight = promauto.NewGaugeVec(prometheus.GaugeOpts{
		Name: "http_requests_in_flight",
		Help: "Currently processing HTTP requests",
	}, []string{"method"})

	CacheHits = promauto.NewCounter(prometheus.CounterOpts{
		Name: "cache_hits_total",
		Help: "Cache hit count",
	})

	CacheMisses = promauto.NewCounter(prometheus.CounterOpts{
		Name: "cache_misses_total",
		Help: "Cache miss count",
	})

	DbPoolAcquireDuration = promauto.NewHistogram(prometheus.HistogramOpts{
		Name:    "db_pool_acquire_duration_seconds",
		Help:    "Time to acquire a DB connection",
		Buckets: prometheus.DefBuckets,
	})

	RedisOpsTotal = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "redis_operations_total",
		Help: "Redis operations",
	}, []string{"operation", "status"})

	SentryEventsSent = promauto.NewCounter(prometheus.CounterOpts{
		Name: "sentry_events_sent_total",
		Help: "Sentry error events sent",
	})
)
