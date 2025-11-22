
import React from 'react';

interface CardProps {
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    contentClassName?: string;
    infoTooltip?: string;
    onExpand?: () => void;
}

const Card: React.FC<CardProps> = ({ title, icon, children, className = '', contentClassName = '', infoTooltip, onExpand }) => {
    return (
        <div className={`bg-brand-secondary/80 backdrop-blur-md border border-brand-accent/30 p-4 md:p-6 rounded-xl shadow-lg h-full flex flex-col transition-all duration-300 hover:shadow-brand-blue/5 hover:border-brand-accent/50 group ${className}`}>
            <div className="flex items-center justify-between mb-4 relative">
                <div className="flex items-center">
                    {icon && <div className="text-brand-blue mr-3 p-2 bg-brand-blue/10 rounded-lg">{icon}</div>}
                    <h3 className="font-semibold text-lg text-white tracking-tight">{title}</h3>
                    
                    {infoTooltip && (
                        <div className="group/tooltip relative ml-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-light/50 hover:text-brand-cyan cursor-help transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-brand-primary border border-brand-accent rounded-lg text-xs text-brand-text shadow-2xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none z-50 backdrop-blur-xl">
                                {infoTooltip}
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-brand-accent"></div>
                            </div>
                        </div>
                    )}
                </div>

                {onExpand && (
                    <button 
                        onClick={onExpand}
                        className="text-brand-light/50 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Expandir visualização"
                        aria-label="Expandir"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                    </button>
                )}
            </div>
            <div className={`flex-grow ${contentClassName}`}>
                {children}
            </div>
        </div>
    );
};

export default Card;
