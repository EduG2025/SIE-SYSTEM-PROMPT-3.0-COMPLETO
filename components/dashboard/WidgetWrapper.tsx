import React from 'react';

interface WidgetWrapperProps {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
    className?: string;
}

const WidgetWrapper: React.FC<WidgetWrapperProps> = ({ icon, title, children, className = '' }) => {
    return (
        <div className={`bg-brand-secondary p-6 rounded-lg shadow-lg h-full flex flex-col ${className}`}>
            <div className="flex items-center mb-4">
                <div className="text-brand-blue">{icon}</div>
                <h3 className="font-semibold text-lg ml-3">{title}</h3>
            </div>
            <div className="flex-grow">
                {children}
            </div>
        </div>
    );
};

export default WidgetWrapper;
