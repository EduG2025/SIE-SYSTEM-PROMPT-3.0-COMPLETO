
# 🧹 Script de Limpeza Final (S.I.E. 3.1.0)

Os seguintes arquivos e pastas foram detectados no seu projeto e devem ser removidos para garantir que o sistema use apenas a nova arquitetura (MySQL + src/).

Execute estes comandos no terminal (na raiz do projeto):

## 1. Pastas Duplicadas na Raiz
*(Todo o código fonte deve residir apenas em `/src`)*
```bash
rm -rf components
rm -rf contexts
rm -rf hooks
rm -rf data
rm -rf middleware
rm -rf config controllers models routes services
```

## 2. Arquivos Soltos na Raiz
*(Estes arquivos já foram migrados para `/src`)*
```bash
rm App.tsx
rm index.tsx
rm types.ts
rm constants.ts
rm moduleRegistry.ts
```

## 3. Dados Mockados Antigos
*(O sistema agora usa o Banco de Dados MySQL)*
```bash
rm -rf src/data/mock
rm src/data/sources.ts
rm src/data/sources.json
rm src/data/timelineEvents.tsx
```

## 4. Testes e Desenvolvimento
```bash
rm -rf src/services/__tests__
rm -rf src/test
rm src/contexts/ConfigContext.ts # Manter apenas o .tsx
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
