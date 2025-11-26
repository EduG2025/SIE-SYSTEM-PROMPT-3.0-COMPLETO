
# 📘 S.I.E. 3.1.0 - Documentação Completa do Sistema
**Sistema de Investigação Estratégica**

---

## 📋 Índice

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura Tecnológica](#2-arquitetura-tecnológica)
3. [Estrutura de Diretórios](#3-estrutura-de-diretórios)
4. [Guia de Instalação e Deploy (VPS)](#4-guia-de-instalação-e-deploy-vps)
5. [Módulos de Inteligência](#5-módulos-de-inteligência)
6. [Administração e Configuração](#6-administração-e-configuração)
7. [Banco de Dados (Schema)](#7-banco-de-dados-schema)
8. [Segurança e Autenticação](#8-segurança-e-autenticação)

---

## 1. Visão Geral

O **S.I.E.** é uma plataforma de inteligência governamental (GovTech) projetada para monitorar, correlacionar e analisar dados públicos com foco em integridade, detecção de riscos e análise política. O sistema utiliza Inteligência Artificial (Google Gemini) para auditar diários oficiais, cruzar dados de empresas e políticos, e gerar relatórios forenses.

### Principais Capacidades
*   **Monitoramento Político:** Análise de perfil, evolução patrimonial e rede de conexões.
*   **Compliance:** Detecção de nepotismo, laranjas e contratos suspeitos.
*   **Investigação Forense (IA):** Motor de busca profunda que gera dossiês automáticos.
*   **Dashboard Estratégico:** Visualização de dados em tempo real personalizável.

---

## 2. Arquitetura Tecnológica

O sistema opera em uma arquitetura **Monolítica Modular** adaptada para ambientes VPS/CloudPanel.

### Frontend (Client-Side)
*   **Framework:** React 18 (via Vite)
*   **Linguagem:** TypeScript
*   **Estilização:** Tailwind CSS (Tema dinâmico via CSS Variables)
*   **Visualização de Dados:** Recharts (Gráficos e Radares)
*   **Gerenciamento de Estado:** Context API (`AuthContext`, `ConfigContext`, `MunicipalityContext`)

### Backend (Server-Side)
*   **Runtime:** Node.js 18+
*   **Framework:** Express.js
*   **ORM:** Sequelize
*   **Banco de Dados:** MySQL 8.0+ (Uso intensivo de colunas JSON)
*   **IA:** Integração direta com Google Gemini via `@google/genai` SDK.
*   **Agendamento:** `node-cron` para tarefas de fundo.

### Infraestrutura
*   **Proxy Reverso:** Nginx (Gerencia SSL, Gzip e roteamento `/api`).
*   **Gerenciador de Processos:** PM2.
*   **Storage:** Sistema de arquivos local (`/storage/uploads`) servido estaticamente.

---

## 3. Estrutura de Diretórios

```
/
├── dist/                   # Build de produção do Frontend (HTML/JS/CSS)
├── scripts/                # Scripts de automação (seed, migrate, deploy)
├── storage/                # Arquivos de upload persistentes
├── src/
│   ├── components/         # Componentes React (UI)
│   │   ├── admin/          # Painéis administrativos
│   │   ├── dashboard/      # Widgets do Dashboard
│   │   ├── political/      # Componentes do módulo político (Grafos, Timelines)
│   │   ├── settings/       # Telas de configuração
│   │   └── ...
│   ├── config/             # Configurações do Backend (DB, Version)
│   ├── contexts/           # React Contexts (Auth, Theme, Config)
│   ├── controllers/        # Lógica de negócio da API (Backend)
│   ├── middleware/         # Middlewares Express (Auth, Upload, Error)
│   ├── models/             # Definições Sequelize (MySQL Tables)
│   ├── routes/             # Definição de endpoints da API
│   ├── services/           # Serviços Frontend (dbService) e Backend (backendAiService)
│   ├── types/              # Definições TypeScript compartilhadas
│   ├── App.tsx             # Roteamento Frontend
│   └── index.tsx           # Entry point Frontend
├── server.js               # Entry point Backend (Express)
├── ecosystem.config.js     # Configuração PM2
└── vite.config.ts          # Configuração Vite
```

---

## 4. Guia de Instalação e Deploy (VPS)

### Pré-requisitos
*   Servidor Ubuntu/Debian.
*   Node.js v18 ou superior.
*   MySQL v8.0 ou superior.
*   Nginx.

### Passo a Passo

1.  **Configuração de Ambiente (.env):**
    ```ini
    PORT=3000
    NODE_ENV=production
    DB_HOST=127.0.0.1
    DB_NAME=sie301
    DB_USER=sie301
    DB_PASS=SuaSenhaForte
    JWT_SECRET=SegredoJWT
    API_KEY=AIzaSy... (Chave Google Gemini do Sistema)
    ```

2.  **Instalação e Build:**
    ```bash
    npm install                 # Instala dependências
    npm run migrate             # Cria tabelas no MySQL
    npm run seed                # Cria usuário admin e dados iniciais
    npm run build               # Compila o Frontend React para /dist
    ```

3.  **Execução (PM2):**
    ```bash
    npm install -g pm2
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup
    ```

4.  **Configuração Nginx (Proxy):**
    Configure o Vhost para apontar `/api` para `localhost:3000` e `/` para a pasta `/dist`.
    *Nota: Veja o arquivo `server.md` para a configuração exata do Nginx.*

---

## 5. Módulos de Inteligência

### 📊 Dashboard Estratégico
*   **Funcionalidade:** Visão geral do município com widgets arrastáveis (Drag & Drop).
*   **Widgets:** Prefeito/Vice, Radar de Reputação, Temas de Crise, Notícias de Alto Impacto.
*   **IA:** Gera resumos automáticos e análise de sentimento.

### 🏛️ Político (Profile & Network)
*   **Perfil:** Biografia, Salário, Votações e Riscos (Judicial, Financeiro).
*   **Grafo de Conexões:** Visualização interativa (`PoliticalNetwork.tsx`) de aliados, empresas e laranjas.
*   **Linha do Tempo:** Histórico eleitoral e partidário.
*   **Dossiê IA:** Botão para gerar relatório completo via Gemini.

### 👥 Funcionários
*   **Detector de Nepotismo:** A IA cruza sobrenomes e nomeações com a liderança política.
*   **Cargos Críticos:** Identifica cargos sensíveis (Finanças, Licitação) automaticamente.

### 🏢 Empresas & Contratos
*   **Análise de Risco:** Score baseado em valor contratado, processos e sócios politicamente expostos (PEP).
*   **Monitoramento:** Alertas para contratos de alto valor ou sem licitação.

### 🔍 Pesquisa Investigativa (Forensics)
*   **Motor de Busca:** Interface de chat onde a IA atua como auditor.
*   **Funcionalidades:** Busca profunda na web, filtro por fontes oficiais (.gov.br), geração de relatório JSON com "Red Flags".

### ⚖️ Jurídico & OCR
*   **Judicial:** Acompanhamento de processos.
*   **OCR:** Módulo para upload de PDFs/Imagens de diários oficiais, extraindo texto e identificando nomes citados.

---

## 6. Administração e Configuração

### Gerenciamento de Usuários & Planos
*   **RBAC:** Níveis de acesso `admin` e `user`.
*   **Planos:** Definição de cotas de requisição e acesso a módulos (Starter, Pro, Enterprise).
*   **Limites:** Middleware `quotaMiddleware` bloqueia excesso de uso.

### Personalização (Whitelabel)
*   **Temas:** Editor visual de cores (Primária, Secundária, Acento) com preview em tempo real.
*   **Homepage:** Editor da landing page pública (Ativar/Desativar, Textos, Imagens).

### Configuração de IA
*   **System Prompt:** Defina a "personalidade" da IA globalmente.
*   **Automação:** Agendamento de varreduras (Cron Jobs) via painel.
*   **Chaves de API:** Pool de chaves do sistema ou opção BYOK (Bring Your Own Key) para usuários Enterprise.

---

## 7. Banco de Dados (Schema)

O sistema utiliza uma abordagem híbrida (Relacional + Documento).

### Tabelas Principais
*   `users`: Credenciais e vínculo com planos.
*   `plans`: Definição de recursos e limites (JSON).
*   `modules`: Registro de módulos ativos e regras de IA (JSON).
*   `api_keys`: Pool de chaves e contagem de uso.

### Data Lake (Tabelas de Domínio)
Estas tabelas usam colunas `JSON` extensivamente para flexibilidade de dados coletados via scraping/IA.

*   `politicians`:
    *   `risks` (JSON): `{ judicial: 'Alto', financial: 'Médio' }`
    *   `connections` (JSON): Array de conexões do grafo.
    *   `assets` (JSON): Histórico patrimonial.
*   `companies`: `partners` (JSON), `alerts` (JSON).
*   `employees`: `alerts` (JSON) para nepotismo/compliance.
*   `dashboard_data`: Cache completo do dashboard por município.

---

## 8. Segurança e Autenticação

1.  **JWT (JSON Web Tokens):** Autenticação stateless. Token armazenado no `localStorage`.
2.  **Bcrypt:** Hashing de senhas com salt.
3.  **Rate Limiting:**
    *   API Geral: 300 reqs/15min.
    *   Login: 10 tentativas/hora (Prevenção Brute-force).
4.  **Helmet:** Proteção de headers HTTP.
5.  **CORS:** Configurado para produção.
6.  **Auditoria:** Tabela `audit_logs` registra ações críticas e uso de IA.

---

**S.I.E. - Sistema de Investigação Estratégica**
*Versão 3.1.0 - Build 2025.06.01*
