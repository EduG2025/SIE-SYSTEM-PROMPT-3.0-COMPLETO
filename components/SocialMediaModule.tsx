

import React, { useState, useEffect } from 'react';
import type { SocialPost } from '../types';
import { dbService } from '../services/dbService';
import Spinner from './common/Spinner';


const SentimentPill: React.FC<{ sentiment: SocialPost['sentiment'] }> = ({ sentiment }) => {
    const sentimentStyles: Record<SocialPost['sentiment'], string> = {
        Positive: 'text-green-300 bg-green-900',
        Negative: 'text-red-300 bg-red-900',
        Neutral: 'text-gray-300 bg-gray-700',
    };
    
    const sentimentText: Record<SocialPost['sentiment'], string> = {
        Positive: 'Positivo',
        Negative: 'Negativo',
        Neutral: 'Neutro',
    }

    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${sentimentStyles[sentiment]}`}>
            {sentimentText[sentiment]}
        </span>
    );
};

const SocialMediaModule: React.FC = () => {
    const [posts, setPosts] = useState<SocialPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const data = await dbService.getSocialPosts();
            setPosts(data);
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

    return (
        <div className="space-y-6">
            <h3 className="text-2xl font-semibold">Monitoramento de Redes Sociais</h3>
            <div className="bg-brand-secondary p-4 rounded-lg">
                <p className="text-brand-light">Mostrando posts coletados nas últimas 48 horas.</p>
            </div>
            <div className="space-y-4">
                {posts.map(post => (
                    <div key={post.id} className="bg-brand-secondary p-5 rounded-lg shadow-lg">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center space-x-3">
                                <span className={`font-bold ${post.platform === 'Facebook' ? 'text-blue-400' : 'text-pink-400'}`}>{post.platform}</span>
                                <span className="text-white font-semibold">{post.author}</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <span className="text-sm text-brand-light">{post.timestamp}</span>
                                <SentimentPill sentiment={post.sentiment} />
                            </div>
                        </div>
                        <p className="text-brand-text">{post.content}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SocialMediaModule;