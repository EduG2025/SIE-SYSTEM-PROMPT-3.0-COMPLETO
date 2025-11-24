#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

REPO_URL="https://github.com/EduG2025/SIE-SYSTEM-PROMPT-3.0-COMPLETO.git"
PROJECT_DIR="/home/jennyai-sie/htdocs/sie.jennyai.space"
PM2_APP_NAME="sie-backend"
NODE_VERSION="18"

log() { echo -e "\e[1;32m[setup]\e[0m $*"; }
err() { echo -e "\e[1;31m[error]\e[0m $*" >&2; }

#############################################
# 1. Pré-requisitos
#############################################
log "Atualizando sistema..."
sudo apt update -y
sudo apt upgrade -y

log "Instalando dependências básicas..."
sudo apt install -y git curl build-essential nginx

#############################################
# 2. Node.js + PM2
#############################################
if ! command -v node >/dev/null 2>&1; then
  log "Instalando Node.js ${NODE_VERSION}..."
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
  sudo apt install -y nodejs
else
  log "Node já instalado: $(node -v)"
fi

if ! command -v pm2 >/dev/null 2>&1; then
  log "Instalando PM2..."
  sudo npm install -g pm2
fi

#############################################
# 3. Buscar projeto do GitHub
#############################################
if [ ! -d "$PROJECT_DIR" ]; then
  log "Clonando projeto do GitHub..."
  sudo git clone "$REPO_URL" "$PROJECT_DIR"
else
  log "Projeto já existe. Atualizando do GitHub..."
  cd "$PROJECT_DIR"

  git fetch --all --prune
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

  log "Resetando para branch atual: $CURRENT_BRANCH"
  git reset --hard origin/"$CURRENT_BRANCH"
  git pull --rebase
fi

cd "$PROJECT_DIR"

#############################################
# 4. Instalar dependências Node
#############################################
if [ -f package.json ]; then
  log "Instalando dependências do Node..."

  if [ -f package-lock.json ]; then
    npm ci --no-audit --prefer-offline
  else
    npm install --no-audit --prefer-offline
  fi
else
  err "package.json não encontrado no projeto!"
fi

#############################################
# 5. Build do frontend/back-end
#############################################
if npm run | grep -q "build"; then
  log "Executando npm run build..."
  npm run build
else
  log "Nenhum script de build encontrado."
fi

#############################################
# 6. PM2 – inicializar projeto
#############################################
if pm2 describe "$PM2_APP_NAME" >/dev/null 2>&1; then
  log "Reiniciando app no PM2..."
  pm2 restart "$PM2_APP_NAME"
else
  log "Iniciando aplicação com PM2..."
  pm2 start server.cjs --name "$PM2_APP_NAME" --update-env
fi

pm2 save
pm2 startup systemd -u "$USER" --hp "$HOME" >/dev/null 2>&1 || true

#############################################
# 7. Permissões
#############################################
log "Ajustando permissões..."
sudo chown -R "$USER":"$USER" "$PROJECT_DIR"
find "$PROJECT_DIR" -type d -exec chmod 755 {} \;
find "$PROJECT_DIR" -type f -exec chmod 644 {} \;

#############################################
# 8. Nginx (opcional)
#############################################
NGINX_CONF="/etc/nginx/sites-available/sie.jennyai.space"

log "Criando configuração do Nginx..."

sudo tee "$NGINX_CONF" >/dev/null <<EOF
server {
  listen 80;
  server_name sie.jennyai.space;

  location / {
    proxy_pass http://localhost:3000;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
  }
}
EOF

sudo ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/sie.jennyai.space

log "Testando e recarregando Nginx..."
sudo nginx -t && sudo systemctl reload nginx

#############################################
# 9. Fim
#############################################
log "Setup + Deploy concluído com sucesso!"
echo ""
echo "👉 PM2 Status: pm2 status"
echo "👉 Logs: pm2 logs $PM2_APP_NAME --lines 200"
echo "👉 Projeto: $PROJECT_DIR"
