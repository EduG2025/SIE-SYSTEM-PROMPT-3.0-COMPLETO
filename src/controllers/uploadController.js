const { MediaFile } = require('../models');
const path = require('path');
const fs = require('fs');

// Garante que o diretório temporário exista
const TEMP_DIR = path.join(__dirname, '../../storage/uploads/temp');
const UPLOAD_DIR = path.join(__dirname, '../../storage/uploads');

if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const UploadController = {
    // Upload Padrão (Arquivo Único Completo)
    uploadFile: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'Nenhum arquivo enviado' });
            }

            const moduleName = req.body.module || 'system';
            const userId = req.user ? req.user.id : 'public';
            
            // Mover para pasta organizada por módulo/usuário (se quiser refinar, mas manteremos na raiz de uploads por enquanto para compatibilidade)
            // A lógica de salvar já foi feita pelo Multer no `path` configurado.

            // Registro no Banco de Dados
            const newFile = await MediaFile.create({
                originalName: req.file.originalname,
                filename: req.file.filename,
                mimeType: req.file.mimetype,
                size: req.file.size,
                path: req.file.path,
                module: moduleName,
                uploadedBy: req.user ? req.user.id : null
            });

            // Construção da URL pública
            const publicUrl = `/media/${req.file.filename}`;

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
    },

    // 1. Receber Chunk (Pedaço)
    uploadChunk: async (req, res) => {
        try {
            if (!req.file) return res.status(400).json({ message: 'Chunk vazio' });

            const { chunkIndex, fileId } = req.body;
            
            // Salva o chunk com um nome sequencial temporário
            const chunkPath = path.join(TEMP_DIR, `${fileId}_${chunkIndex}`);
            
            // O multer salva com um nome aleatório em req.file.path. Vamos renomear para manter ordem.
            fs.renameSync(req.file.path, chunkPath);

            res.json({ success: true, message: `Chunk ${chunkIndex} recebido` });
        } catch (error) {
            console.error("Chunk Error:", error);
            res.status(500).json({ message: 'Erro ao salvar chunk', error: error.message });
        }
    },

    // 2. Montar Arquivo Final (Assemble)
    completeChunkedUpload: async (req, res) => {
        try {
            const { fileId, originalName, mimeType } = req.body;
            
            // Encontrar todos os chunks
            const chunks = fs.readdirSync(TEMP_DIR)
                .filter(file => file.startsWith(`${fileId}_`))
                .sort((a, b) => {
                    const idxA = parseInt(a.split('_')[1]);
                    const idxB = parseInt(b.split('_')[1]);
                    return idxA - idxB;
                });

            if (chunks.length === 0) {
                return res.status(400).json({ message: 'Nenhum pedaço encontrado para montagem.' });
            }

            // Nome final do arquivo
            const timestamp = Date.now();
            const ext = path.extname(originalName);
            const finalFilename = `${timestamp}-${Math.round(Math.random() * 1E9)}${ext}`;
            const finalPath = path.join(UPLOAD_DIR, finalFilename);

            // Criar Stream de Escrita
            const writeStream = fs.createWriteStream(finalPath);

            for (const chunk of chunks) {
                const chunkPath = path.join(TEMP_DIR, chunk);
                const data = fs.readFileSync(chunkPath);
                writeStream.write(data);
                fs.unlinkSync(chunkPath); // Deleta chunk após uso
            }

            writeStream.end();

            // Esperar o stream fechar para garantir que o arquivo existe e pegar tamanho
            await new Promise(resolve => writeStream.on('finish', resolve));
            const stat = fs.statSync(finalPath);

            // Registrar no Banco
            const newFile = await MediaFile.create({
                originalName: originalName,
                filename: finalFilename,
                mimeType: mimeType,
                size: stat.size,
                path: finalPath,
                module: 'chunked_upload',
                uploadedBy: req.user ? req.user.id : null
            });

            res.json({
                success: true,
                message: 'Arquivo montado com sucesso',
                file: {
                    id: newFile.id,
                    url: `/media/${finalFilename}`,
                    name: originalName,
                    size: stat.size
                }
            });

        } catch (error) {
            console.error("Assembly Error:", error);
            res.status(500).json({ message: 'Erro na montagem do arquivo', error: error.message });
        }
    }
};

module.exports = { UploadController };
