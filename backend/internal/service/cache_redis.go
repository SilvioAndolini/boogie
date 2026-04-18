package service

import (
	"context"
	"encoding/json"
	"log/slog"
	"time"

	"github.com/boogie/backend/internal/metrics"
	"github.com/redis/go-redis/v9"
)

type Cache interface {
	GetOrFetch(ctx context.Context, key string, ttl time.Duration, fetch func() (interface{}, error)) (interface{}, error)
	GetOrFetchInto(ctx context.Context, key string, ttl time.Duration, target interface{}, fetch func() (interface{}, error)) error
	DeleteByPrefix(ctx context.Context, prefix string)
	Delete(ctx context.Context, key string)
}

type RedisCache struct {
	rdb *redis.Client
}

func NewRedisCache(rdb *redis.Client) *RedisCache {
	return &RedisCache{rdb: rdb}
}

func (c *RedisCache) GetOrFetch(ctx context.Context, key string, ttl time.Duration, fetch func() (interface{}, error)) (interface{}, error) {
	val, err := c.rdb.Get(ctx, key).Result()
	if err == nil {
		metrics.CacheHits.Inc()
		return val, nil
	}
	if err != redis.Nil {
		slog.Warn("[redis-cache] get error", "key", key, "error", err)
	}

	metrics.CacheMisses.Inc()
	result, err := fetch()
	if err != nil {
		return nil, err
	}

	data, marshalErr := json.Marshal(result)
	if marshalErr == nil {
		if setErr := c.rdb.Set(ctx, key, string(data), ttl).Err(); setErr != nil {
			slog.Warn("[redis-cache] set error", "key", key, "error", setErr)
		}
	}

	return result, nil
}

func (c *RedisCache) GetOrFetchInto(ctx context.Context, key string, ttl time.Duration, target interface{}, fetch func() (interface{}, error)) error {
	raw, err := c.rdb.Get(ctx, key).Result()
	if err == nil {
		metrics.CacheHits.Inc()
		if unmarshalErr := json.Unmarshal([]byte(raw), target); unmarshalErr == nil {
			return nil
		}
		slog.Warn("[redis-cache] unmarshal error, refetching", "key", key, "error", err)
	}
	if err != redis.Nil {
		slog.Warn("[redis-cache] get error", "key", key, "error", err)
	}

	metrics.CacheMisses.Inc()
	val, err := fetch()
	if err != nil {
		return err
	}

	data, marshalErr := json.Marshal(val)
	if marshalErr == nil {
		if setErr := c.rdb.Set(ctx, key, string(data), ttl).Err(); setErr != nil {
			slog.Warn("[redis-cache] set error", "key", key, "error", setErr)
		}
		json.Unmarshal(data, target)
	}

	return nil
}

func (c *RedisCache) DeleteByPrefix(ctx context.Context, prefix string) {
	iter := c.rdb.Scan(ctx, 0, prefix+"*", 100).Iterator()
	keys := make([]string, 0, 100)
	for iter.Next(ctx) {
		keys = append(keys, iter.Val())
		if len(keys) >= 100 {
			c.rdb.Del(ctx, keys...)
			keys = keys[:0]
		}
	}
	if len(keys) > 0 {
		c.rdb.Del(ctx, keys...)
	}
}

func (c *RedisCache) Delete(ctx context.Context, key string) {
	c.rdb.Del(ctx, key)
}

type InMemoryCache struct {
	inner *CacheService
}

func NewInMemoryCache() *InMemoryCache {
	return &InMemoryCache{inner: GetCache()}
}

func (c *InMemoryCache) GetOrFetch(_ context.Context, key string, ttl time.Duration, fetch func() (interface{}, error)) (interface{}, error) {
	return c.inner.GetOrFetch(key, ttl, fetch)
}

func (c *InMemoryCache) GetOrFetchInto(_ context.Context, key string, ttl time.Duration, target interface{}, fetch func() (interface{}, error)) error {
	val, err := c.inner.GetOrFetch(key, ttl, fetch)
	if err != nil {
		return err
	}
	data, mErr := json.Marshal(val)
	if mErr != nil {
		return mErr
	}
	return json.Unmarshal(data, target)
}

func (c *InMemoryCache) DeleteByPrefix(_ context.Context, prefix string) {
	c.inner.mu.Lock()
	for k := range c.inner.entries {
		if len(k) >= len(prefix) && k[:len(prefix)] == prefix {
			delete(c.inner.entries, k)
		}
	}
	c.inner.mu.Unlock()
}

func (c *InMemoryCache) Delete(_ context.Context, key string) {
	c.inner.Delete(key)
}

func NewCache(rdb *redis.Client) Cache {
	if rdb != nil {
		return NewRedisCache(rdb)
	}
	slog.Info("[cache] using in-memory fallback")
	return NewInMemoryCache()
}
