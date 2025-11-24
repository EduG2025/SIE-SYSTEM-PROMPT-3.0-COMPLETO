# Manual de Instalação e Deploy - S.I.E. v3.1.0

Este guia abrange todos os métodos de instalação suportados pelo Sistema de Investigação Estratégica.

---

## Opção 1: Instalação Automática em VPS (Recomendado)
*Ideal para: Ubuntu 20.04/22.04/24.04, Debian 11/12*

1.  Acesse seu servidor via SSH.
2.  Navegue até a pasta do projeto.
3.  Dê permissão de execução e rode o script de setup:

```bash
chmod +x setup.sh
./setup.sh
```

---

## Opção 2: Deploy com Docker
Certifique-se de ter Docker e Docker Compose instalados.

1.  Configure o arquivo `.env` na raiz do projeto.
2.  Inicie os containers:
```bash
docker-compose up -d --build
```

---

## Configuração do Banco de Dados
Se não usar o Docker, você precisará importar o schema manualmente ou rodar as migrations no servidor MySQL.

**Via NPM (Recomendado):**
```bash
npm run migrate
npm run seed
```

**Via SQL Manual:**
1. Acesse o MySQL: `mysql -u root -p`
2. Crie o banco: `CREATE DATABASE sie_datalake;`
3. Importe o arquivo: `mysql -u root -p sie_datalake < database/schema.sql`

---

## Verificação
Acesse `http://localhost:3000/api/system/status` para verificar se a API e o Banco de Dados estão operacionais.
Você deve receber um JSON confirmando a versão **3.1.0**.