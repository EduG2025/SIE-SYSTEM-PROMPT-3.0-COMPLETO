const moduleService = require('../services/moduleService');
const AdmZip = require('adm-zip');
const fs = require('fs');

const ModuleController = {
    getModules: async (req, res) => {
        try {
            const modules = await moduleService.getAll();
            res.json(modules);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar módulos', error: error.message });
        }
    },

    getModuleById: async (req, res) => {
        try {
            const module = await moduleService.getById(req.params.id);
            if (!module) return res.status(404).json({ message: 'Módulo não encontrado' });
            res.json(module);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar módulo', error: error.message });
        }
    },

    updateModule: async (req, res) => {
        try {
            const { id } = req.params;
            const updated = await moduleService.update(id, req.body);
            res.json({ success: true, module: updated, message: 'Módulo atualizado' });
        } catch (error) {
            res.status(400).json({ message: 'Erro ao atualizar módulo', error: error.message });
        }
    },

    createModule: async (req, res) => {
        try {
            const created = await moduleService.create(req.body);
            res.status(201).json(created);
        } catch (error) {
            res.status(400).json({ message: 'Erro ao criar módulo', error: error.message });
        }
    },

    deleteModule: async (req, res) => {
        try {
            await moduleService.delete(req.params.id);
            res.json({ message: 'Módulo removido com sucesso' });
        } catch (error) {
            res.status(400).json({ message: 'Erro ao remover módulo', error: error.message });
        }
    },

    // Instalação via Upload de ZIP
    installModulePackage: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'Nenhum arquivo ZIP enviado.' });
            }

            const zipPath = req.file.path;
            const zip = new AdmZip(zipPath);
            const zipEntries = zip.getEntries();

            // 1. Procurar manifest.json
            const manifestEntry = zipEntries.find(entry => entry.entryName === 'manifest.json' || entry.entryName.endsWith('/manifest.json'));
            
            if (!manifestEntry) {
                fs.unlinkSync(zipPath); // Limpeza
                return res.status(400).json({ message: 'Arquivo manifest.json não encontrado no pacote.' });
            }

            // 2. Ler e Validar Manifesto
            const manifestContent = manifestEntry.getData().toString('utf8');
            let manifest;
            try {
                manifest = JSON.parse(manifestContent);
            } catch (e) {
                fs.unlinkSync(zipPath);
                return res.status(400).json({ message: 'manifest.json inválido.' });
            }

            if (!manifest.id || !manifest.name || !manifest.view) {
                fs.unlinkSync(zipPath);
                return res.status(400).json({ message: 'Manifesto inválido. Campos obrigatórios: id, name, view.' });
            }

            // 3. Registrar no Banco de Dados
            const newModuleData = {
                id: manifest.id,
                name: manifest.name,
                view: manifest.view,
                icon: manifest.icon || 'cube',
                active: false, // Instala inativo por padrão
                hasSettings: !!manifest.hasSettings,
                rules: manifest.defaultRules ? JSON.stringify(manifest.defaultRules) : null,
                updateFrequency: manifest.updateFrequency || '24h'
            };

            // Verifica se já existe e atualiza ou cria
            const existing = await moduleService.getById(newModuleData.id);
            let result;
            
            if (existing) {
                result = await moduleService.update(newModuleData.id, newModuleData);
            } else {
                result = await moduleService.create(newModuleData);
            }
            
            // Limpeza do arquivo temporário
            fs.unlinkSync(zipPath);

            res.status(200).json({ 
                success: true, 
                message: `Módulo '${manifest.name}' instalado com sucesso! Ative-o na lista.`,
                module: result
            });

        } catch (error) {
            console.error("Install Error:", error);
            if (req.file && req.file.path && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path); // Cleanup
            }
            res.status(500).json({ message: 'Falha na instalação do pacote', error: error.message });
        }
    }
};

module.exports = { ModuleController };