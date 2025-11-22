
# Instalação Manual na VPS (CloudPanel)

Como houve erros na geração automática dos arquivos, siga estes passos para criar os arquivos críticos diretamente no servidor via terminal SSH.

### 1. Criar o Servidor Backend (`server.cjs`)

Copie e cole todo o bloco abaixo no seu terminal SSH. Isso criará o arquivo `server.cjs` configurado para o seu banco de dados.

```bash
cat > server.cjs << 'EOF'
const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
const cors = require('cors');
const compression = require('compression');
const bcrypt = require('bcryptjs');

// --- CONFIGURAÇÃO ---
const DB_CONFIG = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'sie301',
    password: process.env.DB_PASSWORD || 'Gegerminal180!',
    database: process.env.DB_NAME || 'sie301',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const PORT = process.env.PORT || 3000;
const app = express();

// --- MIDDLEWARE ---
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

// --- BANCO DE DADOS (Key-Value Store via MySQL) ---
const pool = mysql.createPool(DB_CONFIG);

// Inicializa Tabela Genérica (NoSQL on SQL)
async function initDB() {
    try {
        const conn = await pool.getConnection();
        await conn.query(`
            CREATE TABLE IF NOT EXISTS system_store (
                store_key VARCHAR(255) PRIMARY KEY,
                store_value LONGJSON,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✅ Tabela system_store verificada/criada.');
        conn.release();
    } catch (err) {
        console.error('❌ Erro ao iniciar DB:', err.message);
    }
}
initDB();

// --- ROTAS DA API ---

// Health Check
app.get('/api/status', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT 1');
        res.json({ status: 'Conectado', db: 'MySQL Online', version: '3.1.0' });
    } catch (err) {
        res.status(500).json({ status: 'Erro', details: err.message });
    }
});

// Salvar Estado (Sync Completo)
app.post('/api/state', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const data = req.body;
        await conn.beginTransaction();

        // Salva cada chave principal do JSON como uma linha no MySQL
        // Isso permite que politicians, users, companies sejam salvos independentemente
        for (const [key, value] of Object.entries(data)) {
            await conn.query(
                'INSERT INTO system_store (store_key, store_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE store_value = VALUES(store_value)',
                [key, JSON.stringify(value)]
            );
        }

        await conn.commit();
        res.json({ success: true });
    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        conn.release();
    }
});

// Ler Estado (Carregamento Inicial)
app.get('/api/state', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM system_store');
        const state = {};
        rows.forEach(row => {
            // MySQL retorna JSON como objeto ou string dependendo do driver, garantimos parse
            state[row.store_key] = (typeof row.store_value === 'string') 
                ? JSON.parse(row.store_value) 
                : row.store_value;
        });
        res.json(state);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- SERVIR FRONTEND (SPA) ---
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 S.I.E. Server rodando na porta ${PORT}`);
});
EOF
```

---

### 2. Criar o Script de Instalação (`setup.sh`)

Copie e cole este bloco para criar o script que instala as dependências e configura o ambiente.

```bash
cat > setup.sh << 'EOF'
#!/bin/bash

# Cores
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}>>> Iniciando Configuração do S.I.E. 3.1.0 (CloudPanel Edition)${NC}"

# 1. Carregar Variáveis de Ambiente
export DB_HOST="127.0.0.1"
export DB_NAME="sie301"
export DB_USER="sie301"
export DB_PASSWORD="Gegerminal180!"
export PORT=3000

# Criar .env para persistência
echo "DB_HOST=127.0.0.1" > .env
echo "DB_NAME=sie301" >> .env
echo "DB_USER=sie301" >> .env
echo "DB_PASSWORD=Gegerminal180!" >> .env
echo "PORT=3000" >> .env

# 2. Instalar Dependências
echo -e "${GREEN}>>> Instalando bibliotecas Node.js...${NC}"
npm install express mysql2 cors compression bcryptjs dotenv

# 3. Build do Frontend
echo -e "${GREEN}>>> Compilando Frontend (React)...${NC}"
npm run build

# 4. Configurar PM2 (Process Manager)
echo -e "${GREEN}>>> Configurando PM2...${NC}"
npm install -g pm2
pm2 delete sie-server 2>/dev/null || true
pm2 start server.cjs --name "sie-server"
pm2 save
pm2 startup

echo -e "${GREEN}>>> SUCESSO! O sistema está rodando na porta 3000.${NC}"
echo "Certifique-se que o Vhost do Nginx tem o bloco 'location /api' apontando para localhost:3000"
EOF
```

---

### 3. Executar a Instalação

Agora que os arquivos foram criados, execute o comando final para rodar tudo:

```bash
chmod +x setup.sh
./setup.sh
```
