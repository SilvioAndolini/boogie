// Package util provides shared utility functions.
package util

import "math"

// Round2 rounds a float64 to 2 decimal places.
func Round2(v float64) float64 {
	return math.Round(v*100) / 100
}
