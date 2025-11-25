# S.I.E. 3.1.0 - Sistema de Investigação Estratégica

## Visão Geral
O S.I.E. é uma plataforma de inteligência governamental desenvolvida para monitorar, correlacionar e analisar dados públicos com foco em integridade, detecção de riscos e análise política. O sistema utiliza inteligência artificial (Google Gemini) para varrer diários oficiais, portais de transparência e redes sociais.

## Stack Tecnológico
- **Frontend**: React 18 (Vite), TypeScript, Tailwind CSS, Recharts.
- **Backend**: Node.js 18+, Express.js.
- **Banco de Dados**: MySQL 8.0+ (com suporte nativo a tipos JSON).
- **ORM**: Sequelize.
- **IA**: Google Gemini 2.5 Flash (via Google GenAI SDK).
- **Infraestrutura**: Docker, Nginx (Proxy Reverso).

## Funcionalidades Principais (v3.1.0)
- **Arquitetura Modular**: Separação clara entre serviços de domínio (Políticos, Empresas, Contratos).
- **Database Híbrido**: Dados estruturados (Users, Plans) e semi-estruturados (Intelligence JSON) no MySQL.
- **IA Autônoma**: Scheduler interno (`node-cron`) para varreduras automáticas diárias/semanais.
- **Gestão Completa**: Painel administrativo para controle de usuários, planos, temas e chaves de API.
- **Uploads**: Gerenciamento de arquivos locais com mapeamento de rotas estáticas.
- **Segurança**: Autenticação JWT, Rate Limiting, Helmet e validação de permissões (RBAC).

## Instalação Rápida (Dev)

1. Configure o arquivo `.env` na raiz:
   ```env
   DB_HOST=127.0.0.1
   DB_NAME=sie_datalake
   DB_USER=root
   DB_PASS=senha
   API_KEY=sua_chave_gemini
   PORT=3000
   ```

2. Instale dependências:
   ```bash
   npm install
   ```

3. Inicialize o banco de dados:
   ```bash
   npm run migrate
   npm run seed
   ```

4. Inicie o servidor (Backend + Frontend Build):
   ```bash
   npm start
   ```
   *Ou para desenvolvimento com Hot-Reload:*
   ```bash
   npm run dev
   ```

## Deploy em Produção (VPS)
Consulte `MANUAL_INSTALL.md` ou `DOCKER_MANUAL.md` para instruções detalhadas.

O método recomendado é utilizar o script de automação:
```bash
./setup.sh
```

## Estrutura de Pastas
- `/src/controllers`: Lógica de controle das requisições.
- `/src/services`: Regras de negócio, acesso a dados e integrações (Gemini).
- `/src/models`: Definições de tabelas (Sequelize).
- `/src/routes`: Rotas da API Express.
- `/src/components`: Componentes React (Frontend).
- `/storage`: Uploads persistentes.
