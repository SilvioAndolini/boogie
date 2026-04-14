// Package idgen provides cryptographically secure ID generation.
package idgen

import (
	"crypto/rand"
	"encoding/hex"
	"math/big"
	"time"
)

// New generates a random 16-character hex ID (8 bytes of entropy).
func New() string {
	b := make([]byte, 8)
	if _, err := rand.Read(b); err != nil {
		panic("crypto/rand failed: " + err.Error())
	}
	return hex.EncodeToString(b)
}

// CodigoReserva generates a human-readable reserva code like "BOO-ABC123-XYZW".
func CodigoReserva() string {
	ts := encodeBase36(time.Now().UnixMilli(), 8)
	randPart := randomBase36(4)
	return "BOO-" + ts + "-" + randPart
}

func randomBase36(width int) string {
	max := new(big.Int).Exp(big.NewInt(36), big.NewInt(int64(width)), nil)
	n, err := rand.Int(rand.Reader, max)
	if err != nil {
		panic("crypto/rand failed: " + err.Error())
	}
	return padLeft(encodeBase36Big(n, width), "0", width)
}

func encodeBase36(n int64, width int) string {
	const charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
	if n == 0 {
		return padLeft("0", "0", width)
	}
	result := ""
	for n > 0 {
		result = string(charset[n%36]) + result
		n /= 36
	}
	return padLeft(result, "0", width)
}

func encodeBase36Big(n *big.Int, width int) string {
	const charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
	zero := big.NewInt(0)
	thirtySix := big.NewInt(36)
	if n.Cmp(zero) == 0 {
		return padLeft("0", "0", width)
	}
	result := ""
	temp := new(big.Int).Set(n)
	for temp.Cmp(zero) > 0 {
		rem := new(big.Int).Mod(temp, thirtySix)
		result = string(charset[rem.Int64()]) + result
		temp.Div(temp, thirtySix)
	}
	return padLeft(result, "0", width)
}

func padLeft(s, pad string, width int) string {
	for len(s) < width {
		s = pad + s
	}
	if len(s) > width {
		s = s[len(s)-width:]
	}
	return s
}
