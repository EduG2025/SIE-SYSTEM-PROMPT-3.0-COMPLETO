import React from 'react';

interface CardProps {
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    contentClassName?: string;
    infoTooltip?: string; // Nova prop para o texto explicativo
}

const Card: React.FC<CardProps> = ({ title, icon, children, className = '', contentClassName = '', infoTooltip }) => {
    return (
        <div className={`bg-brand-secondary p-4 md:p-6 rounded-lg shadow-lg h-full flex flex-col ${className}`}>
            <div className="flex items-center mb-4 relative">
                {icon && <div className="text-brand-blue mr-3">{icon}</div>}
                <h3 className="font-semibold text-lg text-white">{title}</h3>
                
                {/* Renderização do Tooltip se a prop existir */}
                {infoTooltip && (
                    <div className="group relative ml-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-light/50 hover:text-brand-cyan cursor-help transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        
                        {/* Balão do Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-brand-primary border border-brand-accent/50 rounded-lg text-xs text-brand-text shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                            {infoTooltip}
                            {/* Seta do balão */}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-brand-accent/50"></div>
                        </div>
                    </div>
                )}
            </div>
            <div className={`flex-grow ${contentClassName}`}>
                {children}
            </div>
        </div>
    );
};

export default Card;