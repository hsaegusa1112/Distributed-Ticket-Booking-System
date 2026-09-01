FROM golang:1.27-alpine AS builder

WORKDIR /app

COPY go.mod ./
RUN go mod download

COPY main.go ./
RUN go build -o auth-service main.go

FROM alpine:3.21

WORKDIR /app
COPY --from=builder /app/auth-service ./auth-service

EXPOSE 8081

CMD ["./auth-service"]