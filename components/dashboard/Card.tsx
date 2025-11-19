import React from 'react';

interface CardProps {
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    contentClassName?: string;
}

const Card: React.FC<CardProps> = ({ title, icon, children, className = '', contentClassName = '' }) => {
    return (
        <div className={`bg-brand-secondary p-4 md:p-6 rounded-lg shadow-lg h-full flex flex-col ${className}`}>
            <div className="flex items-center mb-4">
                {icon && <div className="text-brand-blue mr-3">{icon}</div>}
                <h3 className="font-semibold text-lg text-white">{title}</h3>
            </div>
            <div className={`flex-grow ${contentClassName}`}>
                {children}
            </div>
        </div>
    );
};

export default Card;
