
import React, { useEffect, useState } from 'react';
import { loadingService } from '../../services/loadingService';

const GlobalLoadingBar: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        return loadingService.subscribe(setIsLoading);
    }, []);

    if (!isLoading) return null;

    return (
        <div className="fixed top-0 left-0 w-full h-1 z-[9999] bg-brand-secondary/50">
            <div className="h-full bg-gradient-to-r from-brand-blue via-brand-cyan to-brand-blue bg-[length:200%_100%] animate-loading-bar shadow-[0_0_10px_#3B82F6]"></div>
        </div>
    );
};

export default GlobalLoadingBar;
