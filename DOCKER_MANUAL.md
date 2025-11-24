# Manual de Infraestrutura Docker - S.I.E. 3.1

Este guia fornece os arquivos e instruções para rodar o S.I.E. em containers Docker, ideal para VPS ou ambientes de desenvolvimento isolados.

---

## 1. Arquivos de Configuração

### `Dockerfile` (Imagem do Servidor)
Crie um arquivo chamado `Dockerfile` na raiz do projeto:

```dockerfile
# Build Stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
# Instala dependências incluindo devDependencies para o build
RUN npm install
COPY . .
# Gera o build do frontend (pasta dist)
RUN npm run build

# Production Stage
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
# Instala apenas dependências de produção
RUN npm install --omit=dev
# Copia o código fonte e o build gerado no estágio anterior
COPY . .
COPY --from=builder /app/dist ./dist

# Expõe a porta
EXPOSE 3000

# Define variáveis de ambiente padrão (podem ser sobrescritas pelo docker-compose)
ENV NODE_ENV=production
ENV PORT=3000

# Inicia o servidor
CMD ["node", "server.cjs"]
```

### `docker-compose.yml` (Orquestração)
Crie um arquivo `docker-compose.yml` na raiz:

```yaml
version: '3.8'

services:
  # Servidor de Aplicação (Node.js + Frontend Estático)
  app:
    container_name: sie_app
    build: .
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=db
      - DB_USER=sie_user
      - DB_PASSWORD=sie_secret_pass
      - DB_NAME=sie_datalake
      - JWT_SECRET=change_this_secret_in_production
      - API_KEY=${API_KEY}
    depends_on:
      db:
        condition: service_healthy
    volumes:
      # Persistência de uploads
      - ./storage:/app/storage
    networks:
      - sie_network

  # Banco de Dados MySQL 8.0
  db:
    image: mysql:8.0
    container_name: sie_db
    command: --default-authentication-plugin=mysql_native_password
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: root_secret_pass
      MYSQL_DATABASE: sie_datalake
      MYSQL_USER: sie_user
      MYSQL_PASSWORD: sie_secret_pass
    ports:
      - "3306:3306" # Opcional: Expor se quiser acessar externamente
    volumes:
      - sie_mysql_data:/var/lib/mysql
    networks:
      - sie_network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10

volumes:
  sie_mysql_data:

networks:
  sie_network:
    driver: bridge
```

---

## 2. Como Rodar (Passo a Passo)

### Pré-requisitos
- Docker e Docker Compose instalados.

### Passo 1: Configurar
Crie um arquivo `.env` na raiz (opcional, pois o docker-compose já define defaults, mas recomendado para API Keys):
```bash
API_KEY=sua_chave_gemini_aqui
```

### Passo 2: Iniciar
No terminal, execute:
```bash
docker-compose up -d --build
```
Isso irá:
1. Baixar a imagem do MySQL.
2. Construir a imagem do S.I.E. (compilando o React e configurando o Node).
3. Iniciar os containers em background.

### Passo 3: Verificar
Acesse `http://localhost:3000`.
O sistema deve estar rodando. O backend Node.js servirá tanto a API quanto o Frontend React.

---

## 3. Comandos Úteis

**Ver logs:**
```bash
docker-compose logs -f app
```

**Parar sistema:**
```bash
docker-compose down
```

**Acessar shell do container:**
```bash
docker exec -it sie_app sh
```

**Resetar banco de dados (Cuidado!):**
```bash
docker-compose down -v
```
