import React, { useState } from 'react';
import Modal from '../../common/Modal';
import { validateApiKey } from '../../../services/geminiService';

interface ApiKeyFormModalProps {
    onClose: () => void;
    onAddKey: (key: string) => Promise<void>;
}

const ApiKeyFormModal: React.FC<ApiKeyFormModalProps> = ({ onClose, onAddKey }) => {
    const [newKey, setNewKey] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    const handleValidateAndAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsValidating(true);
        setValidationError(null);

        const isValid = await validateApiKey(newKey);
        if (isValid) {
            await onAddKey(newKey);
            // The parent component will handle closing the modal on success.
        } else {
            setValidationError('Chave de API inválida, expirada ou sem permissões de uso.');
            setIsValidating(false);
        }
    };

    return (
        <Modal title="Adicionar Nova Chave de API" onClose={onClose}>
            <form onSubmit={handleValidateAndAdd} className="space-y-4">
                <div>
                    <label htmlFor="api-key-input" className="text-sm text-brand-light mb-1 block">
                        Nova Chave Gemini
                    </label>
                    <input
                        id="api-key-input"
                        type="password"
                        value={newKey}
                        onChange={(e) => setNewKey(e.target.value)}
                        placeholder="Cole a chave de API aqui"
                        className="w-full bg-brand-primary p-2 rounded border border-brand-accent font-mono"
                        required
                        autoFocus
                    />
                     <p className="text-xs text-brand-light mt-1">A chave será validada para garantir que está ativa e funcional.</p>
                </div>

                {validationError && (
                    <p className="bg-red-500/20 text-red-400 text-sm p-3 rounded-lg text-center">
                        {validationError}
                    </p>
                )}

                <div className="flex justify-end gap-4 mt-6">
                    <button type="button" onClick={onClose} className="bg-brand-accent text-white px-4 py-2 rounded-lg">
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="bg-brand-blue text-white px-4 py-2 rounded-lg disabled:bg-brand-accent disabled:cursor-not-allowed"
                        disabled={isValidating || !newKey.trim()}
                    >
                        {isValidating ? 'Verificando...' : 'Verificar e Adicionar'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ApiKeyFormModal;