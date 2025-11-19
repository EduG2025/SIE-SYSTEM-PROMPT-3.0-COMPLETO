
import React, { useState, useEffect } from 'react';
import type { User, UserPlan } from '../../types';
import { dbService } from '../../services/dbService';
import Modal from '../common/Modal';

const UserForm: React.FC<{ user: User | null; availablePlans: UserPlan[]; onSave: (user: User) => void; onCancel: () => void; }> = ({ user, availablePlans, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Partial<User>>(user || { username: '', email: '', role: 'user', planId: availablePlans[0]?.id || 'starter', planExpiration: '', status: 'Ativo' });

    useEffect(() => {
        setFormData(user || { username: '', email: '', role: 'user', planId: availablePlans[0]?.id || 'starter', planExpiration: '', status: 'Ativo' });
    }, [user, availablePlans]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, id: user?.id || Date.now() } as User);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="text-sm text-brand-light mb-1 block">Username</label>
                <input type="text" name="username" value={formData.username || ''} onChange={handleChange} className="w-full bg-brand-primary p-2 rounded border border-brand-accent focus:ring-brand-blue focus:border-brand-blue" required />
            </div>
             <div>
                <label className="text-sm text-brand-light mb-1 block">Email</label>
                <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className="w-full bg-brand-primary p-2 rounded border border-brand-accent focus:ring-brand-blue focus:border-brand-blue" />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm text-brand-light mb-1 block">Role</label>
                    <select name="role" value={formData.role} onChange={handleChange} className="w-full bg-brand-primary p-2 rounded border border-brand-accent focus:ring-brand-blue focus:border-brand-blue">
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                 <div>
                    <label className="text-sm text-brand-light mb-1 block">Plano</label>
                    <select name="planId" value={formData.planId} onChange={handleChange} className="w-full bg-brand-primary p-2 rounded border border-brand-accent focus:ring-brand-blue focus:border-brand-blue">
                        {availablePlans.map(plan => (
                            <option key={plan.id} value={plan.id}>{plan.name}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-sm text-brand-light mb-1 block">Expiração do Plano (YYYY-MM-DD)</label>
                    <input type="date" name="planExpiration" value={formData.planExpiration || ''} onChange={handleChange} className="w-full bg-brand-primary p-2 rounded border border-brand-accent focus:ring-brand-blue focus:border-brand-blue" />
                </div>
                <div>
                    <label className="text-sm text-brand-light mb-1 block">Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-brand-primary p-2 rounded border border-brand-accent focus:ring-brand-blue focus:border-brand-blue">
                        <option value="Ativo">Ativo</option>
                        <option value="Inativo">Inativo</option>
                    </select>
                </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
                <button type="button" onClick={onCancel} className="bg-brand-accent text-white px-4 py-2 rounded-lg">Cancelar</button>
                <button type="submit" className="bg-brand-blue text-white px-4 py-2 rounded-lg">Salvar</button>
            </div>
        </form>
    );
};


interface UserManagementProps {
    showToast: (message: string, type: 'success' | 'error') => void;
    onImpersonate: (user: User) => void;
    currentUser: User;
}

const UserManagement: React.FC<UserManagementProps> = ({ showToast, onImpersonate, currentUser }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [plans, setPlans] = useState<UserPlan[]>([]);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const fetchData = async () => {
        const [usersData, plansData] = await Promise.all([
            dbService.getUsers(),
            dbService.getPlans()
        ]);
        setUsers(usersData);
        setPlans(plansData);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSaveUser = async (user: User) => {
        await dbService.saveUser(user, currentUser.username);
        await fetchData();
        
        showToast(user.id ? 'Usuário atualizado com sucesso!' : 'Usuário adicionado com sucesso!', 'success');
        
        setIsUserModalOpen(false);
        setEditingUser(null);
    };

    const handleOpenUserModal = (user: User | null = null) => {
        setEditingUser(user);
        setIsUserModalOpen(true);
    };

    const handleDeleteUser = async (userId: number) => {
        if (userId === currentUser.id) {
            showToast('Você não pode remover a si mesmo.', 'error');
            return;
        }
        if (window.confirm('Tem certeza que deseja remover este usuário? Esta ação é irreversível.')) {
            const success = await dbService.deleteUser(userId, currentUser.username);
            if (success) {
                showToast('Usuário removido com sucesso!', 'success');
                await fetchData();
            } else {
                showToast('Erro ao remover usuário.', 'error');
            }
        }
    };
    
    const getPlanName = (planId: string) => {
        return plans.find(p => p.id === planId)?.name || planId;
    };

    return (
        <div className="bg-brand-secondary p-6 rounded-lg shadow-lg">
             {isUserModalOpen && (
                <Modal title={editingUser ? 'Editar Usuário' : 'Adicionar Usuário'} onClose={() => setIsUserModalOpen(false)}>
                    <UserForm user={editingUser} availablePlans={plans} onSave={handleSaveUser} onCancel={() => setIsUserModalOpen(false)} />
                </Modal>
            )}
            <div className="flex justify-between items-center mb-4">
                 <h4 className="font-bold text-lg">Gerenciar Usuários</h4>
                 <button onClick={() => handleOpenUserModal()} className="bg-brand-blue hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    Adicionar Novo Usuário
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-brand-accent">
                        <tr>
                            <th className="p-3">Usuário</th>
                            <th className="p-3">Role</th>
                            <th className="p-3">Plano</th>
                            <th className="p-3">Expiração</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="border-b border-brand-accent/50 hover:bg-brand-accent/30">
                                <td className="p-3">
                                    <div className="font-medium">{user.username}</div>
                                    <div className="text-xs text-brand-light">{user.email}</div>
                                </td>
                                <td className="p-3"><span className={`px-2 py-1 text-xs rounded-full ${user.role === 'admin' ? 'bg-brand-purple text-white' : 'bg-brand-light text-brand-primary'}`}>{user.role}</span></td>
                                <td className="p-3 font-medium text-brand-blue capitalize">{getPlanName(user.planId)}</td>
                                <td className="p-3">{user.planExpiration ? new Date(user.planExpiration).toLocaleDateString() : 'N/A'}</td>
                                <td className="p-3">
                                  <span className={`px-2 py-1 text-xs rounded-full text-white ${user.status === 'Ativo' ? 'bg-brand-green' : 'bg-brand-red'}`}>{user.status}</span>
                                </td>
                                <td className="p-3 space-x-2 whitespace-nowrap">
                                    <button onClick={() => handleOpenUserModal(user)} className="text-xs bg-brand-accent text-white py-1 px-3 rounded-full hover:bg-brand-blue">Editar</button>
                                     <button 
                                        onClick={() => handleDeleteUser(user.id)} 
                                        className="text-xs bg-brand-red text-white py-1 px-3 rounded-full hover:bg-red-600 disabled:opacity-50"
                                        disabled={user.id === currentUser.id}
                                        title={user.id === currentUser.id ? "Não é possível remover a si mesmo" : "Remover usuário"}
                                    >
                                        Remover
                                    </button>
                                    {(user.role !== 'admin' && user.id !== currentUser.id) && (
                                      <button onClick={() => onImpersonate(user)} className="text-xs bg-brand-cyan text-white py-1 px-3 rounded-full hover:bg-cyan-600">Logar Como</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserManagement;
