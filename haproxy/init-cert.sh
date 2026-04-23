#!/bin/bash

# Configuration
DOMAIN=${1:-chainverify.com}
EMAIL=${2:-admin@chainverify.com}
CERTS_DIR="$(pwd)/haproxy/certs"
LETSENCRYPT_DIR="$(pwd)/haproxy/letsencrypt"

echo "Domain: $DOMAIN"
echo "Email: $EMAIL"

mkdir -p "$CERTS_DIR"
mkdir -p "$LETSENCRYPT_DIR"

if [ ! -f "$CERTS_DIR/fallback.pem" ]; then
  echo "Generating a self-signed fallback certificate so HAProxy can start..."
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$CERTS_DIR/fallback.key" \
    -out "$CERTS_DIR/fallback.crt" \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN"
  cat "$CERTS_DIR/fallback.crt" "$CERTS_DIR/fallback.key" > "$CERTS_DIR/fallback.pem"
  rm "$CERTS_DIR/fallback.crt" "$CERTS_DIR/fallback.key"
fi

echo "Starting HAProxy and Certbot containers..."
docker compose up -d haproxy certbot

echo "Requesting Let's Encrypt certificate through HAProxy..."
docker compose exec certbot certbot certonly \
  --standalone \
  --agree-tos \
  -m "$EMAIL" \
  -d "$DOMAIN" \
  --non-interactive

echo "Combining fullchain and privkey for HAProxy..."
if [ -f "$LETSENCRYPT_DIR/live/$DOMAIN/fullchain.pem" ]; then
  cat "$LETSENCRYPT_DIR/live/$DOMAIN/fullchain.pem" "$LETSENCRYPT_DIR/live/$DOMAIN/privkey.pem" > "$CERTS_DIR/$DOMAIN.pem"
  echo "Certificate successfully generated and prepared for HAProxy!"
  echo "Restarting HAProxy to load the new certificate..."
  docker compose restart haproxy
else
  echo "Failed to generate Let's Encrypt certificate. The fallback cert will be used."
fi
