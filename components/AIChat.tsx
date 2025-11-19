
import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { getAIResponse } from '../services/geminiService';
import { dbService } from '../services/dbService';
import { loadingService } from '../services/loadingService';

const AIChat: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [systemPrompt, setSystemPrompt] = useState<string>('');
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    useEffect(() => {
        // Fetch the system prompt from the database service when the component mounts
        dbService.getSystemPrompt().then(setSystemPrompt);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    
    useEffect(() => {
        if(isOpen && messages.length === 0) {
            setMessages([{ id: Date.now(), sender: 'ai', text: 'Olá! Sou o assistente de IA do S.I.E. Como posso ajudar a analisar os dados hoje?' }]);
        }
    }, [isOpen]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !systemPrompt) return;

        const userMessage: ChatMessage = { id: Date.now(), sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        loadingService.start();

        try {
            const aiResponseText = await getAIResponse(input, systemPrompt);
            const aiMessage: ChatMessage = { id: Date.now() + 1, sender: 'ai', text: aiResponseText };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = { id: Date.now() + 1, sender: 'ai', text: 'Desculpe, ocorreu um erro ao processar sua solicitação.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            loadingService.stop();
        }
    };

    const ChatBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
        const isUser = message.sender === 'user';
        return (
            <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-2 rounded-2xl ${isUser ? 'bg-brand-blue text-white rounded-br-lg' : 'bg-brand-accent text-brand-text rounded-bl-lg'}`}>
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                </div>
            </div>
        );
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 bg-brand-blue text-white rounded-full p-4 shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-primary focus:ring-brand-blue z-50 transition-transform transform hover:scale-110"
                aria-label="Abrir chat com assistente de IA"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-[calc(100%-3rem)] sm:w-96 h-[60vh] max-h-[500px] bg-brand-secondary rounded-2xl shadow-2xl flex flex-col z-50 border border-brand-accent animate-fade-in-up">
            <header className="flex items-center justify-between p-4 border-b border-brand-accent flex-shrink-0">
                <h3 className="font-bold text-lg">Assistente S.I.E.</h3>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-brand-light hover:text-white"
                    aria-label="Fechar chat"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </header>
            <main className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((msg) => (
                    <ChatBubble key={msg.id} message={msg} />
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                         <div className="max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl bg-brand-accent text-brand-text rounded-bl-lg">
                            <div className="flex items-center space-x-2">
                                <span className="h-2 w-2 bg-brand-light rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="h-2 w-2 bg-brand-light rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="h-2 w-2 bg-brand-light rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    </div>
                )}
                 <div ref={messagesEndRef} />
            </main>
            <footer className="p-4 border-t border-brand-accent flex-shrink-0">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Pergunte sobre os dados..."
                        className="w-full bg-brand-primary border border-brand-accent rounded-lg py-2 px-4 text-brand-text placeholder-brand-light focus:outline-none focus:ring-2 focus:ring-brand-blue"
                        disabled={isLoading}
                        autoFocus
                    />
                    <button
                        type="submit"
                        className="bg-brand-blue text-white rounded-lg p-2 disabled:bg-brand-accent disabled:cursor-not-allowed flex-shrink-0"
                        disabled={isLoading || !input.trim()}
                        aria-label="Enviar mensagem"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </form>
            </footer>
        </div>
    );
};

export default AIChat;
