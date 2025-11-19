import React from 'react';

interface ModalProps {
    children: React.ReactNode;
    onClose: () => void;
    title: string;
    size?: 'lg' | '2xl' | '4xl';
}

const Modal: React.FC<ModalProps> = ({ children, onClose, title, size = 'lg' }) => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-up">
        <div className={`bg-brand-secondary p-6 rounded-xl shadow-2xl w-full max-w-${size} border border-brand-accent`}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">{title}</h3>
                <button 
                    onClick={onClose} 
                    className="text-brand-light hover:text-white text-2xl leading-none"
                    aria-label="Fechar modal"
                >
                    &times;
                </button>
            </div>
            {children}
        </div>
    </div>
);

export default Modal;
