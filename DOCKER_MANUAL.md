# Manual de Instalação e Execução via Docker

Este guia cobre como rodar o S.I.E. usando containers Docker. Isso garante que o sistema funcione exatamente da mesma forma no seu Windows e na VPS, eliminando erros de "funciona na minha máquina".

## 1. Estrutura dos Arquivos

*   **`docker-compose.yml`**: O arquivo principal. Ele define 3 serviços:
    1.  `db`: Banco de Dados MySQL 8.0.
    2.  `backend`: Sua API Node.js (Porta 3000 interna).
    3.  `frontend`: Seu site React servido pelo Nginx (Porta 80 pública).
*   **`Dockerfile`**: Receita para criar a imagem do Backend.
*   **`Dockerfile.web`**: Receita para criar a imagem do Frontend (faz o build do React e configura o Nginx).
*   **`nginx.conf`**: Configuração do servidor web interno do Docker.

---

## 2. Rodando no Windows (Localhost)

**Pré-requisitos:**
*   Instalar o [Docker Desktop para Windows](https://www.docker.com/products/docker-desktop/).
*   O Docker Desktop deve estar aberto e rodando (ícone da baleia perto do relógio).

**Passo a Passo:**

1.  Abra a pasta do projeto.
2.  Dê um **duplo clique** no arquivo `start_with_docker.bat`.
3.  Uma janela preta (terminal) vai abrir e começar a baixar e configurar tudo.
4.  Aguarde até aparecer "Containers iniciados!".
5.  Acesse no navegador: **`http://localhost`**

**Comandos Úteis (se preferir usar terminal):**
*   Iniciar: `docker-compose up -d --build`
*   Parar: `docker-compose down`
*   Ver logs: `docker-compose logs -f`

---

## 3. Rodando na VPS (Produção)

**Pré-requisitos:**
*   Acesso SSH à VPS.
*   Docker e Docker Compose instalados na VPS (O script `deploy_vps_docker.sh` tenta instalar automaticamente).

**Passo a Passo:**

1.  Envie os arquivos do projeto para a VPS (via ZIP ou Git).
2.  Acesse a pasta do projeto via SSH.
3.  Dê permissão de execução ao script de deploy:
    ```bash
    chmod +x deploy_vps_docker.sh
    ```
4.  Execute o script:
    ```bash
    ./deploy_vps_docker.sh
    ```

O sistema estará rodando na porta 80 da VPS (ex: `http://72.61.217.128`).

---

## 4. Solução de Problemas Comuns

**Porta 80 ocupada (Windows):**
Se você tem Skype, XAMPP ou IIS rodando, eles podem bloquear a porta 80.
*   *Solução:* Feche esses programas ou edite o `docker-compose.yml` e mude `"80:80"` para `"8080:80"`. Aí você acessa em `http://localhost:8080`.

**Erro de Banco de Dados (Connection Refused):**
Na primeira execução, o MySQL demora uns segundos para iniciar. O Backend pode tentar conectar antes da hora e falhar.
*   *Solução:* O Docker está configurado para reiniciar o backend automaticamente (`restart: always`). Espere 30 segundos e atualize a página.

**Dados Persistentes:**
Os dados do MySQL ficam salvos numa pasta oculta do Docker (volume `sie_mysql_data`). Se você desligar o PC e ligar de novo, seus dados **continuam lá**.
Para apagar tudo e começar do zero: `docker-compose down -v`.