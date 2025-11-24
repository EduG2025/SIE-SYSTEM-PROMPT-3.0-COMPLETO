# S.I.E. 3.1.0 - Sistema de Investigação Estratégica

## Visão Geral
O S.I.E. é uma plataforma de inteligência governamental desenvolvida para monitorar, correlacionar e analisar dados públicos com foco em integridade e detecção de riscos.

## Versão 3.1.0 (Stable)
- **Arquitetura Modular**: Backend reescrito para escalabilidade.
- **Database**: Migração completa para MySQL 8.0+ com suporte nativo a JSON.
- **IA**: Integração nativa com Google Gemini 2.5 Flash para análise forense.
- **Gestão**: Painel administrativo completo para temas, usuários e módulos.
- **Configurações**: Controle granular de Homepage e Temas via API.

## Instalação Rápida

### Requisitos
- Node.js 18+
- MySQL 8.0+

### Passos
1. Configure o arquivo `.env` (veja `.env.example`).
2. Instale dependências: `npm install`.
3. Configure o banco de dados:
   ```bash
   npm run migrate
   npm run seed
   ```
4. Inicie o servidor: `npm start`.

## Estrutura de Pastas
- `/src/controllers`: Lógica de controle das requisições.
- `/src/services`: Regras de negócio e acesso a dados.
- `/src/models`: Definições de tabelas (Sequelize).
- `/src/routes`: Rotas da API Express.
- `/src/middleware`: Autenticação e segurança.

## Deploy
Consulte `MANUAL_INSTALL.md` para guias detalhados de VPS e Docker.