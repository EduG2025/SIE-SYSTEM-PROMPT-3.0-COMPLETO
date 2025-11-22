
import React from 'react';

interface WidgetWrapperProps {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
    className?: string;
    onExpand?: () => void; // Prop para função de expandir
}

const WidgetWrapper: React.FC<WidgetWrapperProps> = ({ icon, title, children, className = '', onExpand }) => {
    return (
        <div className={`bg-brand-secondary p-6 rounded-lg shadow-lg h-full flex flex-col ${className} group relative`}>
            <div className="flex items-center mb-4 justify-between">
                <div className="flex items-center">
                    <div className="text-brand-blue">{icon}</div>
                    <h3 className="font-semibold text-lg ml-3">{title}</h3>
                </div>
                
                {/* Expand Button */}
                {onExpand && (
                    <button 
                        onClick={onExpand}
                        className="text-brand-light hover:text-white p-1.5 rounded-md hover:bg-brand-primary/50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Expandir para leitura imersiva"
                        aria-label="Expandir Widget"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                    </button>
                )}
            </div>
            <div className="flex-grow">
                {children}
            </div>
        </div>
    );
};

export default WidgetWrapper;
