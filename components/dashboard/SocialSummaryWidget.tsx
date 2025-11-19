import React from 'react';
import type { SocialWidgetData } from '../../types';
import WidgetWrapper from './WidgetWrapper';

const SocialSummaryWidget: React.FC<{ data: SocialWidgetData }> = ({ data }) => {
    const icon = <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>;

    return (
        <WidgetWrapper icon={icon} title="Radar de Redes Sociais">
            <div className="space-y-3">
                {data.latestNegativePosts.length > 0 ? (
                    data.latestNegativePosts.map((p, index) => (
                        <div key={index} className="bg-brand-primary p-3 rounded-lg text-sm">
                            <div className="flex justify-between items-center mb-1">
                                <p className="font-semibold text-white">{p.author}</p>
                                <span className={`font-bold text-xs ${p.platform === 'Facebook' ? 'text-blue-400' : 'text-pink-400'}`}>{p.platform}</span>
                            </div>
                            <p className="text-brand-light text-xs line-clamp-2" title={p.content}>{p.content}</p>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-brand-light text-center py-4">Nenhuma postagem negativa recente detectada.</p>
                )}
            </div>
        </WidgetWrapper>
    );
};

export default SocialSummaryWidget;
