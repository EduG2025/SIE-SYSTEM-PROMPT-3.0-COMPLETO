
# Guia de Atualização e Deploy - S.I.E. v3.1.0

Este documento descreve como atualizar o sistema em produção (VPS/CloudPanel).

---

## Atualização via Git (Recomendado)

Se você clonou o repositório na sua VPS:

1. **Baixe as atualizações:**
   ```bash
   git pull origin main
   ```

2. **Atualize dependências (se houver mudanças):**
   ```bash
   npm install
   ```

3. **Recompile o Frontend:**
   ```bash
   npm run build
   ```

4. **Atualize o Banco de Dados:**
   ```bash
   npm run migrate
   ```

5. **Reinicie o Servidor:**
   ```bash
   pm2 reload sie-backend
   ```

---

## Atualização Manual (Upload de Arquivos)

Se você não usa Git na VPS, siga estes passos:

### Tipo 1: Atualizações de Frontend (Visual)
Para alterar layout, componentes ou telas.

1. **No seu PC local:**
   ```bash
   npm install
   npm run build
   ```
2. **Enviar para a VPS:**
   Substitua o conteúdo da pasta `dist/` na VPS pela sua versão local via SFTP/FileZilla.
3. **Reinício:** Não é necessário.

### Tipo 2: Atualizações de Backend (API/Lógica)
Para alterar rotas, serviços de IA ou modelos.

1. **Enviar Arquivos:**
   Envie os arquivos alterados (pasta `src/` ou `server.js`) para a VPS.
2. **Na VPS:**
   ```bash
   npm install
   npm run migrate
   pm2 reload sie-backend
   ```

---

## Logs e Monitoramento

Para verificar se o sistema está rodando corretamente:

```bash
pm2 status
pm2 logs sie-backend
```
