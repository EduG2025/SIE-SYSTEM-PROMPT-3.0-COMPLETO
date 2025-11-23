# Manual de Infraestrutura Docker - S.I.E.

Este documento contém o código fonte exato para todos os arquivos de infraestrutura necessários para rodar o sistema via Docker.

---

## 1. Arquivo de Orquestração (`docker-compose.yml`)
Salvel este código como **`docker-compose.yml`** na raiz do projeto.

```yaml
version: '3.8'

services:
  # 1. Banco de Dados MySQL
  db:
    image: mysql:8.0
    container_name: sie_db_container
    command: --default-authentication-plugin=mysql_native_password
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: sie_datalake
      MYSQL_USER: sie_user
      MYSQL_PASSWORD: sie_password
    volumes:
      - sie_mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10
    networks:
      - sie_network

  # 2. Backend API (Node.js)
  backend:
    build: 
      context: .
      dockerfile: Dockerfile
    container_name: sie_backend_container
    restart: always
    depends_on:
      db:
        condition: service_healthy
    environment:
      - DB_HOST=db
      - DB_USER=sie_user
      - DB_PASSWORD=sie_password
      - DB_NAME=sie_datalake
      - PORT=3000
      - JWT_SECRET=sie_docker_secure_secret
      # A API Key do Google deve ser passada via arquivo .env na raiz ou substituída aqui
      - API_KEY=${API_KEY}
    expose:
      - "3000"
    networks:
      - sie_network

  # 3. Frontend Web (Nginx + React)
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.web
    container_name: sie_frontend_container
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - sie_network

volumes:
  sie_mysql_data:

networks:
  sie_network:
    driver: bridge
```

---

## 2. Container do Backend (`Dockerfile`)
Salvel este código como **`Dockerfile`** (sem extensão) na raiz.

```dockerfile
# Imagem base leve do Node.js
FROM node:18-alpine

# Diretório de trabalho no container
WORKDIR /app

# Instalar dependências do sistema necessárias para compilação (opcional, mas bom para compatibilidade)
RUN apk add --no-cache python3 make g++

# Copiar arquivos de dependência primeiro (para cache do Docker)
COPY package*.json ./

# Instalar dependências
RUN npm install --omit=dev

# Copiar o restante do código fonte
COPY . .

# Expor a porta que a API usa
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["npm", "start"]
```

---

## 3. Container do Frontend (`Dockerfile.web`)
Salvel este código como **`Dockerfile.web`** na raiz.

```dockerfile
# Estágio 1: Build do React
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Estágio 2: Servidor Nginx
FROM nginx:alpine
# Copia o build do React para a pasta do Nginx
COPY --from=build /app/dist /usr/share/nginx/html
# Copia a configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 4. Configuração do Nginx (`nginx.conf`)
Salvel este código como **`nginx.conf`** na raiz.

```nginx
server {
    listen 80;
    
    # Diretório onde o React build foi copiado
    root /usr/share/nginx/html;
    index index.html;

    # Configuração de compressão Gzip para velocidade
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Rota para a API (Proxy Reverso)
    # Redireciona qualquer chamada /api/... para o container 'backend' na porta 3000
    location /api {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Rota principal (Single Page Application)
    # Se o arquivo não existir, serve o index.html (para o React Router funcionar)
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 5. Script para Windows (`start_with_docker.bat`)
Salvel este código como **`start_with_docker.bat`** na raiz.

```batch
@echo off
echo ==========================================
echo      INICIANDO S.I.E. VIA DOCKER
echo ==========================================
echo.
echo Certifique-se que o Docker Desktop esta rodando.
echo Parando containers antigos...
docker-compose down

echo.
echo Construindo e iniciando novos containers...
echo Isso pode levar alguns minutos na primeira vez.
docker-compose up -d --build

echo.
echo ==========================================
echo      SISTEMA INICIADO COM SUCESSO!
echo ==========================================
echo.
echo Acesse no seu navegador: http://localhost
echo.
pause
```

---

## 6. Script para VPS Linux (`deploy_vps_docker.sh`)
Salvel este código como **`deploy_vps_docker.sh`** na raiz.

```bash
#!/bin/bash

echo ">>> Iniciando Deploy Docker na VPS..."

# 1. Verificar se Docker está instalado
if ! command -v docker &> /dev/null
then
    echo "Docker não encontrado. Instalando..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    echo "Docker instalado."
else
    echo "Docker já está instalado."
fi

# 2. Verificar Docker Compose
if ! command -v docker-compose &> /dev/null
then
    echo "Docker Compose Plugin não encontrado (tentando usar 'docker compose')..."
fi

# 3. Derrubar versão antiga e subir nova
echo ">>> Reiniciando Containers..."
docker-compose down
docker-compose up -d --build

echo ">>> DEPLOY CONCLUÍDO!"
echo "O sistema deve estar acessível na porta 80 (HTTP) deste servidor."
```
