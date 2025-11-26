
# 🧹 Script de Limpeza Final (S.I.E. 3.1.0)

Os seguintes arquivos e pastas foram detectados no seu projeto e devem ser removidos para garantir que o sistema use apenas a nova arquitetura (MySQL + src/).

Execute estes comandos no terminal (na raiz do projeto):

## 1. Pastas de Legado na Raiz
*(A arquitetura correta usa apenas a pasta `/src`)*
```bash
rm -rf middleware
rm -rf config controllers models routes services
```

## 2. Dados Mockados (Falsos)
*(O sistema agora usa o Banco de Dados MySQL)*
```bash
rm -rf src/data/mock
rm src/data/sources.ts
rm src/data/sources.json
rm src/data/timelineEvents.tsx
```

## 3. Conflitos de Tipagem
```bash
rm src/contexts/ConfigContext.ts
# MANTENHA o arquivo ConfigContext.tsx
```

## 4. Testes e Desenvolvimento
```bash
rm -rf src/services/__tests__
rm -rf src/test
```

## 5. Infraestrutura Antiga
```bash
rm Dockerfile docker-compose.yml DOCKER_MANUAL.md
rm setup.sh deploy.sh start_windows.bat server.cjs
```

---
**Após excluir, valide a instalação:**
```bash
npm install
npm run migrate
npm run seed
npm start
```
