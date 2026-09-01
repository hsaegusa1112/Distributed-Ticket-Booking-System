package main

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

type server struct {
	db        *sql.DB
	jwtSecret []byte
}

type credentials struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type tokenResponse struct {
	AccessToken string `json:"accessToken"`
	TokenType   string `json:"tokenType"`
	ExpiresIn   int64  `json:"expiresIn"`
}

func (s server) healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if err := s.db.PingContext(r.Context()); err != nil {
		http.Error(w, `{"status":"down","service":"auth-service"}`, http.StatusServiceUnavailable)
		return
	}
	json.NewEncoder(w).Encode(map[string]string{"status": "ok", "service": "auth-service"})
}

func (s server) registerHandler(w http.ResponseWriter, r *http.Request) {
	credentials, ok := decodeCredentials(w, r)
	if !ok {
		return
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(credentials.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, `{"error":"unable to create account"}`, http.StatusInternalServerError)
		return
	}

	_, err = s.db.ExecContext(r.Context(), "INSERT INTO users (id, username, password_hash) VALUES ($1, $2, $3)", uuid.New(), credentials.Username, string(passwordHash))
	if err != nil {
		var pqError interface{ SQLState() string }
		if errors.As(err, &pqError) && pqError.SQLState() == "23505" {
			http.Error(w, `{"error":"username is already taken"}`, http.StatusConflict)
			return
		}
		log.Printf("register user: %v", err)
		http.Error(w, `{"error":"unable to create account"}`, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"status": "registered"})
}

func (s server) loginHandler(w http.ResponseWriter, r *http.Request) {
	credentials, ok := decodeCredentials(w, r)
	if !ok {
		return
	}

	var userID uuid.UUID
	var passwordHash string
	err := s.db.QueryRowContext(r.Context(), "SELECT id, password_hash FROM users WHERE username = $1", credentials.Username).Scan(&userID, &passwordHash)
	if err != nil || bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(credentials.Password)) != nil {
		http.Error(w, `{"error":"invalid username or password"}`, http.StatusUnauthorized)
		return
	}

	expiresAt := time.Now().Add(24 * time.Hour)
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":      userID.String(),
		"username": credentials.Username,
		"exp":      expiresAt.Unix(),
		"iat":      time.Now().Unix(),
	})
	signedToken, err := token.SignedString(s.jwtSecret)
	if err != nil {
		http.Error(w, `{"error":"unable to sign token"}`, http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(tokenResponse{AccessToken: signedToken, TokenType: "Bearer", ExpiresIn: int64(time.Until(expiresAt).Seconds())})
}

func decodeCredentials(w http.ResponseWriter, r *http.Request) (credentials, bool) {
	defer r.Body.Close()
	var credentials credentials
	if err := json.NewDecoder(r.Body).Decode(&credentials); err != nil || len(credentials.Username) < 3 || len(credentials.Username) > 64 || len(credentials.Password) < 8 {
		http.Error(w, `{"error":"username must be 3-64 characters and password at least 8 characters"}`, http.StatusBadRequest)
		return credentials, false
	}
	return credentials, true
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", os.Getenv("WEB_ORIGIN"))
		w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("JWT_SECRET must be set")
	}
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		databaseURL = "postgres://ticket_booking:ticket_booking@localhost:5432/ticket_booking?sslmode=disable"
	}
	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		log.Fatalf("open database: %v", err)
	}
	defer db.Close()

	s := server{db: db, jwtSecret: []byte(jwtSecret)}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", s.healthHandler)
	mux.HandleFunc("POST /register", s.registerHandler)
	mux.HandleFunc("POST /login", s.loginHandler)

	addr := fmt.Sprintf(":%s", port)
	log.Printf("Auth microservice listening on http://localhost%s\n", addr)

	if err := http.ListenAndServe(addr, withCORS(mux)); err != nil {
		log.Fatalf("Server failed: %v\n", err)
	}
}
