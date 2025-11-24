const { MediaFile } = require('../models');
const path = require('path');

// Nota: A lógica de salvar o arquivo físico é feita pelo middleware Multer.
// Este controller registra o metadado no banco e retorna a URL.

const UploadController = {
    uploadFile: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'Nenhum arquivo enviado' });
            }

            const moduleName = req.body.module || 'system';
            const userId = req.user ? req.user.id : null;
            
            // Registro no Banco de Dados
            const newFile = await MediaFile.create({
                originalName: req.file.originalname,
                filename: req.file.filename,
                mimeType: req.file.mimetype,
                size: req.file.size,
                path: req.file.path,
                module: moduleName,
                uploadedBy: userId
            });

            // Construção da URL pública
            // O servidor deve servir estáticos de /storage/uploads mapeados para /media
            const publicUrl = `/media/${moduleName}/${userId || 'public'}/${req.file.filename}`;

            res.status(201).json({
                success: true,
                message: 'Upload realizado com sucesso',
                file: {
                    id: newFile.id,
                    url: publicUrl,
                    name: newFile.originalName,
                    mimeType: newFile.mimeType,
                    size: newFile.size
                }
            });
        } catch (error) {
            console.error("Upload Error:", error);
            res.status(500).json({ message: 'Erro interno no processamento do upload', error: error.message });
        }
    }
};

module.exports = { UploadController };