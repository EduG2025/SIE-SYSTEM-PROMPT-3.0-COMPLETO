
# Prompt Mestre para Criação de Módulos S.I.E.

Use este prompt quando quiser pedir para uma IA (ChatGPT, Claude, Gemini) criar um novo módulo para o sistema. Copie e cole o texto abaixo, substituindo `[NOME_DO_MODULO]` e `[DESCRIÇÃO]`.

---

**CONTEXTO:**
Estou desenvolvendo o **S.I.E. (Sistema de Investigação Estratégica)**, uma aplicação React (Vite + TypeScript + Tailwind CSS) focada em inteligência governamental. O sistema usa uma arquitetura centralizada de dados (`dbService.ts`) e integrações com IA Gemini (`geminiService.ts`).

**TAREFA:**
Crie um novo módulo chamado **"[NOME_DO_MODULO]"**.
Descrição funcional: [DESCRIÇÃO DO QUE O MÓDULO DEVE FAZER, EX: MONITORAR GASTOS DE SAÚDE].

**REQUISITOS TÉCNICOS:**
Você deve me fornecer o código XML para atualizar/criar os seguintes arquivos, mantendo a consistência visual e técnica do projeto:

1.  **`src/types.ts`**:
    *   Adicione interfaces de dados para o módulo (ex: `HealthExpense`, `MedicalContract`).
    *   Adicione o nome do módulo ao type `ViewType`.

2.  **`src/components/[Nome]Module.tsx`**:
    *   Crie a interface principal do módulo.
    *   Use componentes visuais existentes como `Spinner`, `RiskIndicator` ou tabelas estilizadas com classes Tailwind `bg-brand-secondary`, `text-brand-light`, etc.
    *   Adicione botões de ação que chamem funções do `dbService`.

3.  **`src/components/settings/[Nome]Settings.tsx`**:
    *   Crie uma tela de configuração usando o `ModuleSettingsLayout`.
    *   Permita editar o "System Prompt" da IA para este módulo.

4.  **`src/services/dbService.ts`**:
    *   Adicione métodos para `get[Dados]`, `save[Dados]` e inicialização de dados mockados se vazio.
    *   Integre ao `DatabaseSchema`.

5.  **`src/services/geminiService.ts`**:
    *   Crie uma função `generate[Nome]Data(municipality)` que usa `ai.models.generateContent` com a tool `googleSearch` para buscar dados reais na web sobre o tema e retornar JSON.

6.  **`src/data/mock/modules.ts`**:
    *   Adicione o objeto do módulo à lista `initialModules` (icon, name, view, active: true).

7.  **`src/App.tsx`**:
    *   Adicione o `lazy import` do novo componente.
    *   Adicione as rotas `/nome` e `/nome/settings`.

**ESTILO VISUAL:**
*   Fundo: `bg-brand-primary` (escuro).
*   Cards/Containers: `bg-brand-secondary`, `border-brand-accent`.
*   Texto: `text-white` (títulos), `text-brand-light` (corpo).
*   Destaques: `text-brand-blue`, `text-brand-cyan`.

Gere o código XML para implementação imediata.
