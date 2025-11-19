import React from 'react';

interface SectionProps {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
    className?: string;
}

const Section: React.FC<SectionProps> = ({ icon, title, children, className = '' }) => (
    <div className={`bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg h-full flex flex-col ${className}`}>
        <div className="flex items-center p-4 border-b border-white/10">
            <div className="text-brand-cyan">{icon}</div>
            <h3 className="font-bold text-lg ml-3 text-gray-100">{title}</h3>
        </div>
        <div className="p-4 flex-grow">{children}</div>
    </div>
);

export default Section;
