
# S.I.E. 3.1.0 - Sistema de Investigação Estratégica

## Visão Geral
O S.I.E. é uma plataforma de inteligência governamental desenvolvida para monitorar, correlacionar e analisar dados públicos com foco em integridade, detecção de riscos e análise política.

## Stack Tecnológico
- **Frontend**: React 18 (Vite), TypeScript, Tailwind CSS.
- **Backend**: Node.js 18+, Express.js.
- **Banco de Dados**: MySQL 8.0+ (Necessário suporte a JSON).
- **ORM**: Sequelize.
- **IA**: Google Gemini.

## Estrutura Limpa
O projeto deve conter apenas:
- `/src` (Todo o código fonte: controllers, models, components)
- `/dist` (Build frontend)
- `/storage` (Uploads)
- `server.js` (Entry point)
- Arquivos de configuração (`package.json`, `.env`, etc)

**Nota:** Se você vir pastas como `mock`, `controllers` (na raiz) ou `middleware` (na raiz), execute o `DELETE_FILES.md`.

## Instalação em VPS (Ubuntu/Debian)

1. **Configure o ambiente:**
   Crie um arquivo `.env` na raiz com as credenciais do seu banco de dados:
   ```env
   DB_HOST=127.0.0.1
   DB_NAME=sie301
   DB_USER=sie301
   DB_PASS=Gegerminal180!
   API_KEY=sua_chave_gemini
   PORT=3000
   JWT_SECRET=segredo_jwt_complexo
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Prepare o Banco de Dados:**
   Execute os scripts de migração e seed para criar tabelas e o usuário admin:
   ```bash
   npm run migrate
   npm run seed
   ```

4. **Build do Frontend:**
   Gere os arquivos estáticos otimizados:
   ```bash
   npm run build
   ```

5. **Inicie o Servidor:**
   Recomenda-se usar PM2 para produção:
   ```bash
   npm install -g pm2
   pm2 start server.js --name sie-backend
   pm2 save
   pm2 startup
   ```
