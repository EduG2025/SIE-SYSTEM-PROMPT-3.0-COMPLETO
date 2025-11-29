
import React, { useState, useEffect } from 'react';
import type { SocialPost, SocialTrend, SocialAlert } from '../types';
import { dbService } from '../services/dbService';
import Spinner from './common/Spinner';

// --- Helper Icons ---
const LikeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
const CommentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const ShareIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" /></svg>;
const PlayIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>;

const SentimentPill: React.FC<{ sentiment: SocialPost['sentiment'] }> = ({ sentiment }) => {
    const sentimentStyles: Record<SocialPost['sentiment'], string> = {
        Positive: 'text-green-300 bg-green-900/50 border-green-500/30',
        Negative: 'text-red-300 bg-red-900/50 border-red-500/30',
        Neutral: 'text-gray-300 bg-gray-700/50 border-gray-500/30',
    };
    
    const sentimentText: Record<SocialPost['sentiment'], string> = {
        Positive: 'Positivo',
        Negative: 'Negativo',
        Neutral: 'Neutro',
    }

    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${sentimentStyles[sentiment]}`}>
            {sentimentText[sentiment]}
        </span>
    );
};

const SocialMediaModule: React.FC = () => {
    const [posts, setPosts] = useState<SocialPost[]>([]);
    const [trends, setTrends] = useState<SocialTrend[]>([]); // Simulação de Trends
    const [alerts, setAlerts] = useState<SocialAlert[]>([]); // Simulação de Alertas
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const data = await dbService.getSocialPosts();
            setPosts(data);
            
            // Simulando processamento de trends e alertas baseado nos posts
            // Em produção, isso viria do backend
            if (data.length > 0) {
                setTrends([
                    { topic: 'Saúde', sentiment: 'Negative', volume: 85 },
                    { topic: 'Obras', sentiment: 'Positive', volume: 45 },
                    { topic: 'Salários', sentiment: 'Neutral', volume: 30 }
                ]);
                const negPosts = data.filter(p => p.sentiment === 'Negative');
                if (negPosts.length > 2) {
                    setAlerts([{
                        id: 'alert-1',
                        type: 'Pico de Negatividade',
                        message: 'Aumento súbito de reclamações sobre Saúde nas últimas 24h.',
                        timestamp: new Date().toISOString()
                    }]);
                }
            }
            
            setLoading(false);
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <Spinner />
            </div>
        );
    }

    // Helper para formatar números (ex: 1200 -> 1.2k)
    const formatMetric = (num?: number) => {
        if (!num) return '0';
        return new Intl.NumberFormat('pt-BR', { notation: 'compact', compactDisplay: 'short' }).format(num);
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-2xl font-bold text-white">Monitoramento Social</h3>
                    <p className="text-brand-light">Termômetro da opinião pública em tempo real.</p>
                </div>
                <button onClick={() => {setLoading(true); dbService.getSocialPosts().then(d => {setPosts(d); setLoading(false)})}} className="text-brand-blue hover:text-white text-sm">Atualizar Feed</button>
            </div>

            {/* Painel de Alertas e Tendências */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-red-900/10 border border-red-500/30 rounded-xl p-5">
                    <h4 className="font-bold text-red-400 mb-3 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        Alertas de Crise
                    </h4>
                    {alerts.length > 0 ? (
                        alerts.map(alert => (
                            <div key={alert.id} className="mb-2 bg-brand-primary/50 p-3 rounded-lg">
                                <p className="font-bold text-sm text-white">{alert.type}</p>
                                <p className="text-xs text-gray-300">{alert.message}</p>
                            </div>
                        ))
                    ) : (
                         <p className="text-sm text-gray-400 italic">Sem alertas críticos no momento.</p>
                    )}
                </div>

                <div className="lg:col-span-2 bg-brand-secondary border border-brand-accent rounded-xl p-5">
                    <h4 className="font-bold text-white mb-3">Tendências de Tópicos</h4>
                    <div className="flex gap-4 flex-wrap">
                        {trends.map((trend, i) => (
                            <div key={i} className="bg-brand-primary px-4 py-2 rounded-lg border border-brand-accent flex items-center">
                                <span className="text-sm font-medium text-white mr-2">#{trend.topic}</span>
                                <div className={`w-2 h-2 rounded-full mr-2 ${trend.sentiment === 'Negative' ? 'bg-red-500' : trend.sentiment === 'Positive' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                                <span className="text-xs text-brand-light">Vol: {trend.volume}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Feed de Posts */}
            <div className="space-y-4">
                <h4 className="font-bold text-white text-lg">Feed Recente</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {posts.map(post => (
                        <div key={post.id} className="bg-brand-secondary p-5 rounded-xl border border-brand-accent/50 hover:border-brand-blue/30 transition-colors shadow-lg flex flex-col h-full">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center space-x-3">
                                    <div className={`p-2 rounded-full ${post.platform === 'Facebook' ? 'bg-blue-600/20 text-blue-400' : post.platform === 'Twitter' ? 'bg-sky-600/20 text-sky-400' : 'bg-pink-600/20 text-pink-400'}`}>
                                        {post.platform === 'Facebook' ? (
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                                        ) : post.platform === 'Twitter' ? (
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                                        ) : (
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                                        )}
                                    </div>
                                    <div>
                                        <span className="block text-white font-semibold text-sm">{post.author}</span>
                                        <span className="text-xs text-brand-light">{post.timestamp}</span>
                                    </div>
                                </div>
                                <SentimentPill sentiment={post.sentiment} />
                            </div>
                            
                            <p className="text-gray-300 text-sm leading-relaxed mb-4 line-clamp-4">{post.content}</p>
                            
                            {/* Thumbnail da Mídia (Se houver) */}
                            {post.thumbnailUrl && (
                                <div className="relative rounded-lg overflow-hidden border border-white/10 w-full h-48 mb-4 group bg-black/50">
                                    <img 
                                        src={post.thumbnailUrl} 
                                        alt="Mídia do post" 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        onError={(e) => {
                                            (e.currentTarget as HTMLImageElement).src = `https://placehold.co/600x400/161B22/E6EDF3?text=Midia+Indisponivel`;
                                        }}
                                    />
                                    {post.isVideo && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
                                            <PlayIcon className="h-12 w-12 text-white opacity-90 drop-shadow-lg" />
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="mt-auto pt-3 border-t border-brand-accent/30 flex justify-between items-center text-xs">
                                <div className="flex gap-3 text-brand-light">
                                    {(post.likes !== undefined) && <span className="flex items-center hover:text-red-400 transition-colors"><LikeIcon /> {formatMetric(post.likes)}</span>}
                                    {(post.comments !== undefined) && <span className="flex items-center hover:text-brand-blue transition-colors"><CommentIcon /> {formatMetric(post.comments)}</span>}
                                    {(post.shares !== undefined) && <span className="flex items-center hover:text-green-400 transition-colors"><ShareIcon /> {formatMetric(post.shares)}</span>}
                                </div>
                                {post.url && (
                                    <a href={post.url} target="_blank" rel="noreferrer" className="text-brand-blue hover:text-white font-medium hover:underline">
                                        Ver original
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SocialMediaModule;
