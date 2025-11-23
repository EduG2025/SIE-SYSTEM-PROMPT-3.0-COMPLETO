
# S.I.E. 3.1.0 - Sistema de Investigação Estratégica
## Documentação Técnica e Manual do Administrador

### 1. Visão Geral da Arquitetura
O S.I.E. opera em uma arquitetura **Híbrida (SPA + API)** otimizada para segurança e desempenho em ambientes VPS (CloudPanel).

*   **Frontend:** React 18 + Vite + TypeScript (Pasta `/src`). Compilado para arquivos estáticos na pasta `/dist`.
*   **Backend:** Node.js + Express (Arquivo `server.cjs`). Roda na porta `3000` via PM2.
*   **Banco de Dados:** MySQL 8.0+. O sistema utiliza um padrão *NoSQL-over-SQL*, armazenando o estado complexo do sistema em colunas JSON para flexibilidade máxima.
*   **Proxy:** Nginx (Configurado no CloudPanel) redireciona chamadas de `/api/*` para `localhost:3000`.

---

### 2. Configuração do Nginx (Vhost na VPS/CloudPanel)

**CRÍTICO:** Para que o sistema funcione em produção, você deve configurar o proxy reverso no Nginx. Sem isso, o Frontend não conseguirá falar com o Backend e dará erro de conexão.

No CloudPanel, vá em **Sites > Gerenciar > Vhost** e adicione o bloco `location /api` dentro da configuração `server`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name seu-dominio.com;
    root /home/usuario-site/htdocs/seu-dominio.com/dist; # Aponta para a pasta dist gerada pelo build
    index index.html;

    # 1. Configuração do Frontend (React Router)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 2. Configuração do Backend (Proxy Reverso)
    # Isso faz o papel do "server.proxy" do Vite em produção
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # ... resto das configurações SSL/Logs do CloudPanel ...
}
```

---

### 3. Scripts de Infraestrutura (VPS)

Estes scripts localizados na raiz do projeto automatizam a manutenção do servidor.

#### `setup.sh` (Instalação e Recuperação)
**Quando usar:** Na primeira instalação ou se o servidor "quebrar" totalmente.
**O que ele faz:**
1.  Instala dependências do Linux e Node.js (PM2, MySQL drivers).
2.  Cria/Recria o arquivo `.env` com as credenciais do banco.
3.  Gera o arquivo `server.cjs` (Backend) limpo e sem erros.
4.  Configura o PM2 para reiniciar o servidor automaticamente se a VPS reiniciar.

**Comando:**
```bash
dos2unix setup.sh && chmod +x setup.sh && ./setup.sh
```

#### `deploy.sh` (Atualização Diária)
**Quando usar:** Sempre que você fizer alterações no código e subir para o GitHub.
**O que ele faz:**
1.  `git pull`: Baixa as novidades do repositório.
2.  `npm install`: Atualiza bibliotecas.
3.  `npm run build`: Reconstrói o site (Frontend).
4.  `pm2 restart`: Reinicia o backend.
5.  **Correção de Permissões:** Garante que o Nginx consiga ler os arquivos.

**Comando:**
```bash
dos2unix deploy.sh && chmod +x deploy.sh && ./deploy.sh
```

---

### 4. Fluxo de Trabalho Git (Atualização do Sistema)

Para aplicar mudanças feitas localmente ou geradas pela IA:

**Passo 1: Salvar e Enviar (Na sua máquina/IDE)**
```bash
# 1. Adicionar todos os arquivos modificados
git add .

# 2. Criar um pacote de atualização (Commit)
git commit -m "Descrição da atualização (ex: Novo módulo de RH)"

# 3. Enviar para a nuvem
git push origin main
```

**Passo 2: Aplicar na VPS**
Você tem duas opções:
1.  **Via Painel:** Acesse *Admin > Sistema > Atualizações* e clique em **"Atualizar VPS"**.
2.  **Via Terminal:** Acesse via SSH e rode `./deploy.sh`.

---

### 5. Configuração de Banco de Dados e .env
As credenciais do banco de dados são gerenciadas pelo `setup.sh`. Se precisar alterá-las manualmente:

1.  Edite o `setup.sh` com as novas senhas.
2.  Rode `./setup.sh` novamente.

**Estrutura do Banco (Tabela Principal):**
Tabela: `sie_system_state`
Coluna: `data` (JSON) -> Contém todo o estado da aplicação (Usuários, Configurações, Módulos).

---

### 6. Solução de Problemas Comuns

**Erro: "Unexpected token <" ou Tela Branca**
*   **Causa:** O Nginx não está redirecionando a API corretamente.
*   **Solução:** Verifique o Vhost no CloudPanel. O bloco `location /api` deve estar presente e apontando para `http://127.0.0.1:3000`. Rode `./deploy.sh` para corrigir permissões.

**Erro: Backend Offline no Painel**
*   **Causa:** O servidor Node.js parou.
*   **Solução:** Rode `pm2 list` no terminal. Se estiver vermelho ou não existir, rode `./setup.sh`.

**Erro: Permissão Negada (403)**
*   **Causa:** Arquivos pertencem ao `root` e não ao usuário do site.
*   **Solução:** O `./deploy.sh` corrige isso automaticamente no final. Execute-o.
