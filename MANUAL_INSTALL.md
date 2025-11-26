
# Manual de Instalação (VPS) - S.I.E. v3.1.0

Este guia cobre a instalação direta em um servidor Linux (VPS Ubuntu/Debian) utilizando Node.js e MySQL.

---

## 1. Preparação do Ambiente

Certifique-se de ter **Node.js (v18+)** e **MySQL (v8.0+)** instalados no servidor.

### Configuração do MySQL
1. Acesse o MySQL:
   ```bash
   mysql -u root -p
   ```
2. Crie o banco de dados e usuário (exemplo):
   ```sql
   CREATE DATABASE sie301 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'sie301'@'localhost' IDENTIFIED BY 'SuaSenhaForte';
   GRANT ALL PRIVILEGES ON sie301.* TO 'sie301'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

---

## 2. Instalação da Aplicação

1. **Upload dos Arquivos:**
   Envie os arquivos do projeto para o servidor (ex: `/var/www/sie`).
   *Nota: Não envie a pasta `node_modules`.*

2. **Instalação de Dependências:**
   Na pasta do projeto, execute:
   ```bash
   npm install
   ```

3. **Configuração (.env):**
   Crie o arquivo `.env` na raiz:
   ```ini
   PORT=3000
   NODE_ENV=production
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_NAME=sie301
   DB_USER=sie301
   DB_PASS=SuaSenhaForte
   JWT_SECRET=troque_isto_por_um_segredo_forte_aleatorio
   API_KEY=AIzaSy... (Sua Chave Google Gemini)
   ```

4. **Inicialização do Banco de Dados:**
   Cria as tabelas e o usuário administrador padrão:
   ```bash
   npm run migrate
   npm run seed
   ```

5. **Compilação do Frontend:**
   Gere os arquivos estáticos do React para a pasta `/dist`:
   ```bash
   npm run build
   ```

---

## 3. Execução em Produção (PM2)

Utilize o PM2 para manter o servidor rodando em segundo plano e reiniciar automaticamente em caso de falha.

1. Instale o PM2 globalmente:
   ```bash
   npm install -g pm2
   ```

2. Inicie o processo usando o arquivo de ecossistema:
   ```bash
   pm2 start ecosystem.config.js
   ```
   *(Ou manualmente: `pm2 start server.js --name "sie-backend"`)*

3. Configure a inicialização automática no boot:
   ```bash
   pm2 save
   pm2 startup
   ```

---

## 4. Configuração do Nginx (Proxy Reverso)

Configure o Nginx para servir o domínio e redirecionar as chamadas de API para o Node.js.

Edite `/etc/nginx/sites-available/seu-dominio`:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    # Aumentar tamanho do upload
    client_max_body_size 50M;

    # 1. Proxy para API Node.js
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 2. Servir Arquivos de Mídia (Uploads)
    location /media/ {
        alias /var/www/sie/storage/uploads/;
        autoindex off;
    }

    # 3. Frontend React (Arquivos Estáticos + Fallback)
    root /var/www/sie/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Reinicie o Nginx: `sudo service nginx restart`.
