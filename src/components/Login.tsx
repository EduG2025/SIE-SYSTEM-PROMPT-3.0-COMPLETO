
import React, { useState } from 'react';
import type { User } from '../types';
import { dbService } from '../services/dbService';

interface LoginProps {
    onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAuthenticating(true);
        setError('');
        
        try {
            const user = await dbService.login(username, password);
            onLogin(user);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Erro ao conectar com o servidor. Verifique se o backend está online.');
            }
            console.error(err);
        } finally {
            setIsAuthenticating(false);
        }
    };
    
    return (
         <div className="fixed inset-0 bg-brand-primary flex items-center justify-center z-50">
            <div className="bg-brand-secondary p-8 rounded-xl shadow-2xl w-full max-w-md border border-brand-accent">
                 <div className="flex items-center mb-6">
                    <div className="bg-brand-blue p-2 rounded-lg mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 10l-2 2m0 0l-2-2m2 2V3" /></svg>
                    </div>
                    <h1 className="text-2xl font-bold text-brand-text">S.I.E. 3.0.3</h1>
                </div>
                <h2 className="text-xl font-semibold text-brand-text mb-6">Acesso ao Sistema</h2>
                
                {error && <p className="bg-red-500/20 text-red-400 text-center text-sm p-3 rounded-lg mb-4">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm text-brand-light mb-1 block">Usuário</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Digite seu usuário"
                            className="w-full bg-brand-primary border border-brand-accent rounded-lg py-3 px-4 text-brand-text placeholder-brand-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                            autoFocus
                            disabled={isAuthenticating}
                        />
                    </div>
                     <div>
                        <label className="text-sm text-brand-light mb-1 block">Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Digite sua senha"
                            className="w-full bg-brand-primary border border-brand-accent rounded-lg py-3 px-4 text-brand-text placeholder-brand-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                            disabled={isAuthenticating}
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-brand-blue text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-brand-accent disabled:cursor-not-allowed flex items-center justify-center"
                        disabled={!username || !password || isAuthenticating}
                    >
                        {isAuthenticating ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Verificando...
                            </>
                        ) : 'Entrar'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
