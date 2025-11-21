
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { dbService } from '../services/dbService';
import type { ThemeConfig, HomepageConfig } from '../types';

interface ConfigContextType {
    theme: ThemeConfig;
    homepage: HomepageConfig | null;
    updateTheme: (newTheme: ThemeConfig) => Promise<void>;
    updateHomepage: (newConfig: HomepageConfig) => Promise<void>;
    isLoading: boolean;
}

const defaultTheme: ThemeConfig = {
    primary: '#0D1117',
    secondary: '#161B22',
    accent: '#30363D',
    text: '#E6EDF3',
    blue: '#3B82F6'
};

const ConfigContext = createContext<ConfigContextType | null>(null);

export const useConfig = () => {
    const context = useContext(ConfigContext);
    if (!context) throw new Error('useConfig deve ser usado dentro de um ConfigProvider');
    return context;
};

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<ThemeConfig>(defaultTheme);
    const [homepage, setHomepage] = useState<HomepageConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Função crítica: Injeta as cores no CSS Root instantaneamente
    // Isso garante que o usuário veja a mudança de cor no momento do clique
    const applyThemeToDom = useCallback((currentTheme: ThemeConfig) => {
        const root = document.documentElement;
        root.style.setProperty('--color-primary', currentTheme.primary);
        root.style.setProperty('--color-secondary', currentTheme.secondary);
        root.style.setProperty('--color-accent', currentTheme.accent);
        root.style.setProperty('--color-text', currentTheme.text);
        root.style.setProperty('--color-blue', currentTheme.blue);
    }, []);

    // Inicialização Resiliente (Cache Local -> Servidor)
    useEffect(() => {
        const loadConfig = async () => {
            try {
                // 1. Feedback Imediato: Carrega do LocalStorage se existir
                const cachedTheme = localStorage.getItem('sie_theme');
                if (cachedTheme) {
                    const parsed = JSON.parse(cachedTheme);
                    setTheme(parsed);
                    applyThemeToDom(parsed);
                }

                // 2. Fonte da Verdade: Sincroniza com o Backend (MySQL)
                // Isso garante que se você mudar de computador, o tema te segue
                const [dbTheme, dbHomepage] = await Promise.all([
                    dbService.getTheme(),
                    dbService.getHomepageConfig()
                ]);

                if (dbTheme) {
                    setTheme(dbTheme);
                    applyThemeToDom(dbTheme);
                    localStorage.setItem('sie_theme', JSON.stringify(dbTheme));
                }
                
                if (dbHomepage) {
                    setHomepage(dbHomepage);
                }

            } catch (error) {
                console.error("Falha ao carregar configurações:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadConfig();
    }, [applyThemeToDom]);

    const updateTheme = async (newTheme: ThemeConfig) => {
        // 1. Visual: Atualiza Estado e DOM imediatamente
        setTheme(newTheme);
        applyThemeToDom(newTheme);
        
        // 2. Persistência Local: Salva no navegador (para F5 rápido)
        localStorage.setItem('sie_theme', JSON.stringify(newTheme));

        // 3. Persistência Remota: Salva no Banco de Dados (Assíncrono)
        try {
            await dbService.saveTheme(newTheme, 'admin');
        } catch (e) {
            console.error("Erro ao salvar tema no backend:", e);
        }
    };

    const updateHomepage = async (newConfig: HomepageConfig) => {
        setHomepage(newConfig);
        try {
            await dbService.saveHomepageConfig(newConfig, 'admin');
        } catch (e) {
            console.error("Erro ao salvar homepage:", e);
        }
    };

    return (
        <ConfigContext.Provider value={{ theme, homepage, updateTheme, updateHomepage, isLoading }}>
            {children}
        </ConfigContext.Provider>
    );
};

export default ConfigProvider;
