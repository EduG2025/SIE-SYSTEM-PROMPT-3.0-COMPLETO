
# Guia de Atualização e Deploy - S.I.E. 3.1

Este documento descreve como atualizar o sistema em produção (VPS/CloudPanel).

## Tipo 1: Atualizações Visuais Rápidas (Sem Código)
Para alterar:
- Cores do Tema
- Logo e Imagem de Fundo
- Título e Subtítulo do Portal
- Chaves de API

1. Faça login como **Admin**.
2. Vá em **Painel Admin > Configurações Gerais (ou Temas)**.
3. Faça as alterações e clique em Salvar.
4. As mudanças são aplicadas instantaneamente para todos os usuários via Banco de Dados.

---

## Tipo 2: Atualizações de Código (Frontend/React)
Para alterar:
- Layout de componentes
- Lógica de telas
- Correção de bugs visuais

### 1. No seu computador local:
Faça as alterações no código e gere a versão de produção:
```bash
# 1. Instale dependências (se houver novas)
npm install

# 2. Gere o pacote otimizado
npm run build
```
Isso criará (ou atualizará) a pasta **`dist/`** na raiz do projeto.

### 2. Enviar para a VPS:
Use FileZilla, WinSCP ou comando SCP para enviar o conteúdo da pasta `dist/` local para a pasta do site na VPS.

**Caminho de Destino (Exemplo CloudPanel):**
`/home/seu-usuario/htdocs/seu-dominio/dist`

> **Nota:** Você deve substituir todos os arquivos dentro da pasta `dist` remota pelos novos.

### 3. Reinício (Opcional para Frontend):
Se você alterou apenas arquivos `.tsx` ou `.css`, **não é necessário reiniciar o servidor**. Apenas recarregue a página no navegador (Ctrl+F5).

---

## Tipo 3: Atualizações de Backend (API/Banco de Dados)
Para alterar:
- Novas rotas de API
- Novos modelos de banco de dados
- Lógica de IA ou Cron Jobs

### 1. Enviar Arquivos:
Envie os arquivos alterados (geralmente dentro de `src/` ou o arquivo `server.cjs`) para a raiz do projeto na VPS.

### 2. Atualizar Dependências (Se necessário):
Se você instalou novos pacotes npm, acesse a VPS via SSH e rode:
```bash
cd /home/seu-usuario/htdocs/seu-dominio
npm install --omit=dev
```

### 3. Reiniciar o Servidor:
Alterações no Node.js exigem reinicialização do processo para entrarem em vigor.
```bash
pm2 restart sie-server
```

### 4. Migração de Banco (Se necessário):
Se você criou novas tabelas ou colunas:
```bash
npm run migrate
# ou
node scripts/sync-db.js
```
