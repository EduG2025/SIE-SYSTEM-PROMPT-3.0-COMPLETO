#!/bin/bash

echo "📘 Gerando Documentação Técnica S.I.E. v3.1..."

# 1. Configurar Ambiente de Docs (Se necessário)
if [ ! -d "docs" ]; then
    mkdir docs
fi

# 2. Gerar Diagramas de Banco de Dados (Mermaid)
# Este script lê os modelos Sequelize e gera um Markdown com Mermaid
cat << 'EOF' > scripts/gen-docs.js
const fs = require('fs');
const path = require('path');
const { sequelize } = require('../src/models');

const generateMermaid = () => {
    let mermaid = "```mermaid\nerDiagram\n";
    const models = sequelize.models;

    // Entidades
    Object.keys(models).forEach(modelName => {
        const model = models[modelName];
        mermaid += `  ${modelName} {\n`;
        Object.keys(model.rawAttributes).forEach(attrName => {
            const attr = model.rawAttributes[attrName];
            let type = attr.type.key || attr.type.constructor.key || 'STRING';
            if(type === 'DECIMAL') type = 'FLOAT';
            mermaid += `    ${type} ${attrName}\n`;
        });
        mermaid += `  }\n`;
    });

    // Relacionamentos (Simplificado para Sequelize)
    Object.keys(models).forEach(modelName => {
        const model = models[modelName];
        if (model.associations) {
             Object.keys(model.associations).forEach(assocName => {
                 const assoc = model.associations[assocName];
                 const targetName = assoc.target.name;
                 // One-To-Many (hasMany)
                 if (assoc.associationType === 'HasMany') {
                     mermaid += `  ${modelName} ||--o{ ${targetName} : "has"\n`;
                 }
                 // Many-To-One (belongsTo)
                 else if (assoc.associationType === 'BelongsTo') {
                      // Evita duplicar a linha se o hasMany já foi desenhado
                 }
             });
        }
    });

    mermaid += "```\n";
    return mermaid;
};

const generateApiDocs = () => {
    // Varredura simples de rotas (regex) nos arquivos de rota
    const routesDir = path.join(__dirname, '../src/routes');
    let docs = "## Catálogo de API (Auto-Generated)\n\n| Método | Endpoint | Descrição (Inferida) |\n|---|---|---|\n";
    
    try {
        const files = fs.readdirSync(routesDir);
        files.forEach(file => {
            if (!file.endsWith('.js') || file === 'index.js') return;
            
            const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
            const group = file.replace('Routes.js', '').toUpperCase();
            
            const regex = /router\.(get|post|put|delete)\(['"]([^'"]+)['"]/g;
            let match;
            while ((match = regex.exec(content)) !== null) {
                const method = match[1].toUpperCase();
                const path = match[2];
                const fullPath = `/api/${group.toLowerCase()}${path === '/' ? '' : path}`;
                docs += `| **${method}** | \`${fullPath}\` | Módulo ${group} |\n`;
            }
        });
    } catch (e) {
        docs += "\nErro ao ler rotas: " + e.message;
    }
    return docs;
};

const main = async () => {
    try {
        await sequelize.authenticate(); // Garante que modelos carregaram
        
        const erDiagram = generateMermaid();
        const apiDocs = generateApiDocs();
        const structure = `
## Estrutura de Diretórios
\`\`\`
/src
  /controllers  (Lógica de Negócio)
  /models       (Definição de Dados Sequelize)
  /routes       (Endpoints API)
  /services     (Integrações: IA, Cron, Backup)
  /config       (DB, Storage)
  /middleware   (Auth, Upload, Erros)
\`\`\`
`;

        const finalDoc = `# Documentação Técnica S.I.E.
*Gerado automaticamente em ${new Date().toISOString()}*

## Diagrama de Entidade-Relacionamento (Banco de Dados)
${erDiagram}

${structure}

${apiDocs}

## Guia de Extensão
Para adicionar novos módulos, consulte o arquivo \`AI_MODULE_PROMPT.md\`.
`;

        fs.writeFileSync('SIEv3_TECHNICAL_DOCS.md', finalDoc);
        console.log("✅ Documentação gerada: SIEv3_TECHNICAL_DOCS.md");
        process.exit(0);
    } catch (error) {
        console.error("Erro fatal:", error);
        process.exit(1);
    }
};

main();
EOF

# 3. Executar Gerador
node scripts/gen-docs.js

echo "📘 Processo de documentação finalizado."
