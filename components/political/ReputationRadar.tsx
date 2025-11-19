import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import type { ReputationData } from '../../types';

interface ReputationRadarProps {
  data: ReputationData[];
}

const ReputationRadar: React.FC<ReputationRadarProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <defs>
            <radialGradient id="colorUv">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.5}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
            </radialGradient>
        </defs>
        <PolarGrid stroke="#30363D" />
        <PolarAngleAxis dataKey="area" tick={{ fill: '#8B949E', fontSize: 12 }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
        <Radar name="Score" dataKey="score" stroke="#3B82F6" fill="url(#colorUv)" fillOpacity={0.8} strokeWidth={2} />
        <Tooltip
            contentStyle={{
                backgroundColor: 'rgba(13, 17, 23, 0.8)',
                borderColor: '#30363D',
                color: '#E6EDF3'
            }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
};

export default ReputationRadar;
