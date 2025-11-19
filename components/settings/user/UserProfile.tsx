
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
    
    // Password Change State
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

        // Validation logic
        if (!name.trim() || !email.trim()) {
            notify('Nome e E-mail são obrigatórios.', 'error');
            return;
        }

        if (newPassword || currentPassword) {
            if (!currentPassword) {
                notify('Por favor, informe a senha atual para realizar alterações de segurança.', 'error');
                return;
            }
            if (currentPassword !== (currentUser.password || '123')) {
                notify('A senha atual está incorreta.', 'error');
                return;
            }
            if (newPassword) {
                if (newPassword !== confirmPassword) {
                    notify('A nova senha e a confirmação não coincidem.', 'error');
                    return;
                }
                if (newPassword.length < 3) {
                    notify('A nova senha deve ter pelo menos 3 caracteres.', 'error');
                    return;
                }
            }
        }

        setIsSaving(true);
        try {
            const updates: any = { username: name, email, avatarUrl };
            if (newPassword) {
                updates.password = newPassword;
            }

            const updatedUser = await dbService.updateUserProfile(currentUser.id, updates);
            setCurrentUser(updatedUser);
            notify('Perfil atualizado com sucesso!', 'success');
            
            // Clear password fields on success
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            
        } catch (error) {
            notify('Erro ao atualizar perfil. Tente novamente.', 'error');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!currentUser) return null;

    return (
        <div className="bg-brand-secondary p-6 rounded-lg shadow-sm h-full">
            <div className="mb-6 pb-4 border-b border-brand-accent/50">
                <h3 className="text-xl font-bold text-white">Editar Perfil</h3>
                <p className="text-sm text-brand-light">Atualize suas informações de identificação e acesso.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
                
                {/* Seção de Avatar e Dados Básicos */}
                <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-shrink-0 flex flex-col items-center space-y-3">
                        <div className="w-32 h-32 rounded-full bg-brand-primary border-4 border-brand-accent flex items-center justify-center overflow-hidden relative group">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = '')} />
                            ) : (
                                <span className="text-4xl font-bold text-brand-light">{name.charAt(0).toUpperCase()}</span>
                            )}
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <span className="text-xs text-white font-semibold">Preview</span>
                            </div>
                        </div>
                         <p className="text-xs text-brand-light text-center max-w-[150px]">A imagem é carregada via URL externa.</p>
                    </div>

                    <div className="flex-grow space-y-4">
                         <div>
                            <label className="block text-sm font-medium text-brand-light mb-1">URL do Avatar</label>
                            <input
                                type="url"
                                value={avatarUrl}
                                onChange={(e) => setAvatarUrl(e.target.value)}
                                placeholder="https://..."
                                className="w-full bg-brand-primary border border-brand-accent rounded-lg py-2 px-4 text-white focus:ring-2 focus:ring-brand-blue focus:outline-none transition-all"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-brand-light mb-1">Nome de Usuário</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-brand-primary border border-brand-accent rounded-lg py-2 px-4 text-white focus:ring-2 focus:ring-brand-blue focus:outline-none transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-brand-light mb-1">E-mail</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-brand-primary border border-brand-accent rounded-lg py-2 px-4 text-white focus:ring-2 focus:ring-brand-blue focus:outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Seção de Segurança */}
                <div className="pt-6 border-t border-brand-accent/50">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        Segurança e Senha
                    </h4>
                    <div className="bg-brand-primary/30 p-5 rounded-lg border border-brand-accent/30">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-brand-light mb-1">Senha Atual</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full bg-brand-secondary border border-brand-accent rounded-lg py-2 px-4 text-white focus:ring-2 focus:ring-brand-blue focus:outline-none transition-all"
                                    placeholder="Necessário para alterações"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-brand-light mb-1">Nova Senha</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-brand-secondary border border-brand-accent rounded-lg py-2 px-4 text-white focus:ring-2 focus:ring-brand-blue focus:outline-none transition-all"
                                    placeholder="Mínimo 3 caracteres"
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-brand-light mb-1">Confirmar Nova Senha</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-brand-secondary border border-brand-accent rounded-lg py-2 px-4 text-white focus:ring-2 focus:ring-brand-blue focus:outline-none transition-all"
                                    placeholder="Repita a nova senha"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Rodapé e Botão de Ação */}
                <div className="flex items-center justify-between pt-4 border-t border-brand-accent/50">
                     <div className="text-xs text-brand-light">
                        <span className="mr-4">Função: <strong className="text-white capitalize">{currentUser.role}</strong></span>
                        <span>Status: <strong className="text-green-400">{currentUser.status}</strong></span>
                    </div>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="bg-brand-blue hover:bg-blue-600 text-white font-bold py-2 px-8 rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        {isSaving ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Salvando...
                            </>
                        ) : 'Salvar Alterações'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UserProfile;
