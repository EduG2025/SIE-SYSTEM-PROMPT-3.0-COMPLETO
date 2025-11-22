
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { dbService } from '../../../services/dbService';
import { useNotification } from '../../../contexts/NotificationContext';

const UserProfile: React.FC = () => {
    const { currentUser, setCurrentUser } = useAuth();
    const { notify } = useNotification();
    
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (currentUser) {
            setName(currentUser.username || '');
            setEmail(currentUser.email || '');
            setAvatarUrl(currentUser.avatarUrl || '');
        }
    }, [currentUser]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        if (newPassword && newPassword !== confirmPassword) {
            notify('As senhas não conferem.', 'error');
            return;
        }

        setIsSaving(true);
        try {
            const updates: any = { username: name, email, avatarUrl };
            if (newPassword) updates.password = newPassword;

            const updatedUser = await dbService.updateUserProfile(currentUser.id, updates);
            setCurrentUser(updatedUser);
            notify('Perfil atualizado com sucesso!', 'success');
            
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            notify('Erro ao atualizar perfil.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (!currentUser) return null;

    return (
        <form onSubmit={handleSave} className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Coluna Esquerda: Avatar */}
                <div className="col-span-1 flex flex-col items-center">
                    <div className="relative w-40 h-40 rounded-full border-4 border-brand-accent bg-brand-primary overflow-hidden group shadow-2xl">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-secondary to-brand-primary">
                                <span className="text-5xl font-bold text-brand-light">{name.charAt(0).toUpperCase()}</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <span className="text-xs font-bold text-white">Preview</span>
                        </div>
                    </div>
                    <div className="mt-4 w-full">
                        <label className="text-xs font-bold text-brand-light uppercase mb-1 block">URL da Imagem</label>
                        <input
                            type="url"
                            value={avatarUrl}
                            onChange={(e) => setAvatarUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full bg-brand-primary border border-brand-accent rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-brand-blue outline-none"
                        />
                    </div>
                </div>

                {/* Coluna Direita: Dados */}
                <div className="col-span-2 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-bold text-brand-light mb-1 block">Nome de Usuário</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-brand-primary border border-brand-accent rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-brand-blue outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-brand-light mb-1 block">E-mail</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-brand-primary border border-brand-accent rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-brand-blue outline-none"
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-brand-accent/30">
                        <h4 className="text-white font-bold mb-4 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            Alterar Senha
                        </h4>
                        <div className="bg-brand-primary/30 p-4 rounded-xl space-y-4">
                            <input
                                type="password"
                                placeholder="Senha Atual (Para confirmar)"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full bg-brand-secondary border border-brand-accent rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-brand-blue outline-none"
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    type="password"
                                    placeholder="Nova Senha"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-brand-secondary border border-brand-accent rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-brand-blue outline-none"
                                />
                                <input
                                    type="password"
                                    placeholder="Confirmar Nova Senha"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-brand-secondary border border-brand-accent rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-brand-blue outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="bg-brand-blue hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
                        >
                            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default UserProfile;
