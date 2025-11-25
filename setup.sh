#!/usr/bin/env bash

### ==============================
###  SIE – SETUP COMPLETO
### ==============================

set -e

log() { echo -e "\033[1;32m[OK]\033[0m $1"; }
err() { echo -e "\033[1;31m[ERRO]\033[0m $1"; }

### ==============================
### 1. Verificar dependências
### ==============================

log "Verificando Node, NPM, PM2 e Git..."

if ! command -v node >/dev/null 2>&1; then err "Node não encontrado!"; exit 1; fi
if ! command -v npm >/dev/null 2>&1; then err "NPM não encontrado!"; exit 1; fi
if ! command -v git >/dev/null 2>&1; then err "Git não encontrado!"; exit 1; fi

if command -v pm2 >/dev/null 2>&1; then
  log "PM2 encontrado."
else
  log "PM2 não encontrado. Instalando..."
  npm install -g pm2
fi

### ==============================
### 2. Atualizar projeto via GitHub
### ==============================

log "Atualizando código do GitHub..."
git reset --hard
git pull --rebase

### ==============================
### 3. Instalar dependências
### ==============================

log "Instalando dependências Node..."
npm install

### ==============================
### 4. Gerar build (Front/Back)
### ==============================

if [ -f "vite.config.js" ] || [ -f "vite.config.ts" ]; then
  log "Gerando build do Vite..."
  npm run build || err "Erro no build Vite!"
else
  log "Nenhum Vite detectado, pulando build..."
fi

### ==============================
### 5. Migrações (Prisma ou Sequelize)
### ==============================

log "Verificando sistema de migração..."

if [ -f "prisma/schema.prisma" ]; then
  log "Rodando Prisma migrate..."
  npx prisma migrate deploy

elif [ -d "src/database/migrations" ]; then
  log "Rodando Sequelize migrations..."
  npx sequelize-cli db:migrate

else
  log "Nenhum sistema de migração encontrado."
fi

### ==============================
### 6. Criar diretórios necessários
### ==============================

mkdir -p logs
mkdir -p temp
log "Pastas base criadas."

### ==============================
### 7. Reiniciar processo (PM2)
### ==============================

if pm2 list >/dev/null 2>&1; then
  log "Reiniciando PM2..."
  
  if pm2 describe sie >/dev/null 2>&1; then
    pm2 restart sie
  else
    log "Iniciando PM2..."
    pm2 start index.js --name sie
  fi
  
  pm2 save
else
  log "PM2 não está rodando."
fi

### ==============================
### 8. Finalização
### ==============================

log "Setup completo com sucesso!"
