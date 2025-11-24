
# Guia de Atualização e Deploy - S.I.E. v3.1.0

Este documento descreve como atualizar o sistema em produção (VPS/CloudPanel).

---

## 🚀 Opção Recomendada: Deploy Automático (Script)

Se você configurou o Git na sua VPS, use o script incluso para atualizar todo o sistema com um único comando.

1. **Conecte-se via SSH** na sua VPS.
2. **Navegue até a pasta** do projeto.
3. **Execute o comando:**

```bash
npm run deploy
```

*O que este comando faz:*
1. Baixa o código mais recente do GitHub (`git pull`).
2. Instala novas dependências (`npm install`).
3. Compila o Frontend React (`npm run build`).
4. Atualiza o Banco de Dados (`npm run migrate`).
5. Reinicia o servidor Backend (`pm2 reload`).

---

## Opção Manual: Deploy via Upload (FTP/SFTP)

Se você não usa Git na VPS, siga estes passos para atualizações manuais.

### Tipo 1: Atualizações de Código (Frontend/React)
Para alterar layout, componentes ou telas.

1. **No seu computador local:**
   ```bash
   npm install
   npm run build
   ```
   Isso atualizará a pasta **`dist/`** na raiz do projeto.

2. **Enviar para a VPS:**
   Use FileZilla ou WinSCP. Substitua o conteúdo da pasta `dist/` na VPS pela sua versão local.
   *Caminho típico:* `/home/seu-usuario/htdocs/seu-dominio/dist`

3. **Reinício:** Não é necessário reiniciar o servidor para mudanças apenas no Frontend.

### Tipo 2: Atualizações de Backend (API/Node.js)
Para alterar rotas, lógica de IA ou modelos de banco.

1. **Enviar Arquivos:**
   Envie os arquivos alterados (pasta `src/` ou arquivo `server.cjs`) para a VPS.

2. **Atualizar Dependências (VPS):**
   ```bash
   npm install
   ```

3. **Migrar Banco de Dados (VPS):**
   Se houve mudança em tabelas:
   ```bash
   npm run migrate
   ```

4. **Reiniciar Servidor:**
   ```bash
   pm2 restart sie-server
   ```

---

## Configuração Rápida (Primeira Instalação)

Se esta é a primeira vez que você instala na VPS:

1. Configure o arquivo `.env` com os dados do banco MySQL.
2. Dê permissão de execução ao script de setup:
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

---

## Solução de Problemas Comuns

**Erro: "Permission denied" ao rodar script**
Execute: `chmod +x scripts/deploy.sh`

**Erro: "502 Bad Gateway"**
O Node.js não está rodando. Verifique os logs: `pm2 logs sie-server`.

**As alterações não aparecem**
Se for Frontend: Limpe o cache do navegador.
Se for Backend: Garanta que rodou `pm2 restart sie-server`.
