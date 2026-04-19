package service

import (
	"encoding/json"
	"log/slog"
	"sync"
	"time"
)

type cacheEntry struct {
	value     interface{}
	cachedAt  time.Time
	ttl       time.Duration
	expiresAt time.Time
}

type CacheService struct {
	mu      sync.RWMutex
	entries map[string]*cacheEntry
	maxSize int
}

var globalCache *CacheService
var cacheOnce sync.Once

func GetCache() *CacheService {
	cacheOnce.Do(func() {
		globalCache = &CacheService{
			entries: make(map[string]*cacheEntry),
			maxSize: 5000,
		}
		go globalCache.cleanup()
	})
	return globalCache
}

func (c *CacheService) Get(key string) (interface{}, bool) {
	c.mu.RLock()
	entry, ok := c.entries[key]
	c.mu.RUnlock()

	if !ok {
		return nil, false
	}

	if time.Now().Before(entry.expiresAt) {
		return entry.value, true
	}

	return entry.value, false
}

func (c *CacheService) Set(key string, value interface{}, ttl time.Duration) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if len(c.entries) >= c.maxSize {
		c.evictOldest(len(c.entries) - c.maxSize + 1)
	}

	now := time.Now()
	c.entries[key] = &cacheEntry{
		value:     value,
		cachedAt:  now,
		ttl:       ttl,
		expiresAt: now.Add(ttl),
	}
}

func (c *CacheService) Delete(key string) {
	c.mu.Lock()
	delete(c.entries, key)
	c.mu.Unlock()
}

func (c *CacheService) GetOrFetch(key string, ttl time.Duration, fetch func() (interface{}, error)) (interface{}, error) {
	val, valid := c.Get(key)
	if valid {
		return val, nil
	}

	if val != nil {
		go c.backgroundRefresh(key, ttl, fetch)
		return val, nil
	}

	fresh, err := fetch()
	if err != nil {
		return nil, err
	}

	c.Set(key, fresh, ttl)
	return fresh, nil
}

func (c *CacheService) GetOrFetchInto(key string, ttl time.Duration, target interface{}, fetch func() (interface{}, error)) error {
	val, err := c.GetOrFetch(key, ttl, fetch)
	if err != nil {
		return err
	}
	data, mErr := json.Marshal(val)
	if mErr != nil {
		return mErr
	}
	return json.Unmarshal(data, target)
}

func (c *CacheService) backgroundRefresh(key string, ttl time.Duration, fetch func() (interface{}, error)) {
	fresh, err := fetch()
	if err != nil {
		slog.Warn("[cache] background refresh failed", "key", key, "error", err)
		return
	}
	c.Set(key, fresh, ttl)
}

func (c *CacheService) evictOldest(count int) {
	for i := 0; i < count; i++ {
		var oldestKey string
		var oldestTime time.Time
		for k, v := range c.entries {
			if oldestKey == "" || v.cachedAt.Before(oldestTime) {
				oldestKey = k
				oldestTime = v.cachedAt
			}
		}
		if oldestKey == "" {
			break
		}
		delete(c.entries, oldestKey)
	}
}

func (c *CacheService) cleanup() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()
	for range ticker.C {
		c.mu.Lock()
		now := time.Now()
		for k, v := range c.entries {
			if now.Sub(v.cachedAt) > v.ttl*2 {
				delete(c.entries, k)
			}
		}
		count := len(c.entries)
		c.mu.Unlock()

		if count > c.maxSize*3/4 {
			slog.Warn("[cache] approaching max size", "current", count, "max", c.maxSize)
		}
	}
}
