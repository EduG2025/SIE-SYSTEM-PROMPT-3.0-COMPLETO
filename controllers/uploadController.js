const { MediaFile } = require('../models');
const path = require('path');

exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Nenhum arquivo enviado' });
        }

        const moduleName = req.body.module || 'system';
        
        const newFile = await MediaFile.create({
            originalName: req.file.originalname,
            filename: req.file.filename,
            mimeType: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
            module: moduleName,
            uploadedBy: req.user ? req.user.id : null
        });

        // Construct a public URL. 
        // Nginx or Express Static must serve '/storage/uploads' mapped to '/media'
        const publicUrl = `/media/${moduleName}/${req.user ? req.user.id : 'public'}/${req.file.filename}`;

        res.status(201).json({
            success: true,
            file: {
                id: newFile.id,
                url: publicUrl,
                name: newFile.originalName
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro no upload', error: error.message });
    }
};