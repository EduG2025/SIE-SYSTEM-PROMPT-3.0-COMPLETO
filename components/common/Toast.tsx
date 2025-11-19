import React, { useEffect } from 'react';

interface ToastProps {
    message: string;
    type: 'success' | 'error';
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
    const baseStyle = 'fixed top-5 right-5 z-[100] p-4 rounded-lg shadow-lg text-white flex items-center animate-fade-in-up';
    const typeStyle = type === 'success' ? 'bg-brand-green' : 'bg-brand-red';

    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`${baseStyle} ${typeStyle}`}>
            <p className="font-semibold">{message}</p>
            <button onClick={onClose} className="ml-4 text-xl leading-none font-bold">&times;</button>
        </div>
    );
};

export default Toast;
