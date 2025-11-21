#!/bin/bash

# S.I.E. Deploy Script
# Usage: ./deploy.sh

echo "🚀 Iniciando Deploy S.I.E. 3.1..."

# 1. Configuração de Segurança do Git (Evita erro fatal em VPS)
git config --global --add safe.directory $(pwd)

# 2. Baixar Código (Força sincronização com a main)
echo "⬇️  Baixando atualizações do GitHub..."
git fetch --all
git reset --hard origin/main

# 3. Instalar Dependências (Backend e Frontend)
echo "📦 Instalando bibliotecas (npm)..."
# A flag --legacy-peer-deps ajuda a evitar conflitos de versão em algumas VPS
npm install --legacy-peer-deps

# 4. Rodar Migrations do Banco de Dados (Se houver mudanças no schema)
# Isso garante que tabelas novas (como 'homepage_content' ou colunas novas) sejam criadas
echo "🗄️  Sincronizando Banco de Dados..."
npm run migrate

# 5. Compilar Frontend (React -> Static Files)
echo "🔨 Compilando aplicação (Build)..."
npm run build

# 6. Reiniciar Backend (Se necessário)
echo "🔄 Reiniciando serviço backend..."
if command -v pm2 &> /dev/null; then
    pm2 restart sie-backend || pm2 start server.cjs --name "sie-backend"
else
    echo "⚠️  PM2 não encontrado. Tentando iniciar com node..."
    nohup node server.cjs > server.log 2>&1 &
fi

# 7. CORREÇÃO CRÍTICA DE PERMISSÕES (CloudPanel / Nginx)
# Define o dono dos arquivos para o usuário do site, senão o Nginx dá erro 403/MIME type
# Substitua 'jennyai-sie' pelo usuário correto do seu sistema se for diferente
USER_GROUP="jennyai-sie:jennyai-sie"
if id "jennyai-sie" &>/dev/null; then
    echo "🔧 Ajustando permissões de arquivo para $USER_GROUP..."
    chown -R $USER_GROUP .
else
    echo "⚠️  Usuário 'jennyai-sie' não encontrado. Pulando ajuste de permissões específicas."
fi

# Garante permissão de leitura/execução para o servidor web
chmod -R 755 .

echo "✅ DEPLOY FINALIZADO COM SUCESSO!"
