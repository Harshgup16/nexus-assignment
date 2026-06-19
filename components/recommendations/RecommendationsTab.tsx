'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '../ui';
import { Recommendation } from '@/lib/types';
import { Cpu, Target, Compass, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

interface Props {
  recommendations: Recommendation[];
}

export const RecommendationsTab: React.FC<Props> = ({ recommendations }) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'product' | 'market' | 'sales'>('all');
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const toggleExpand = (id: string) => {
    if (expandedIds.includes(id)) {
      setExpandedIds(expandedIds.filter(item => item !== id));
    } else {
      setExpandedIds([...expandedIds, id]);
    }
  };

  const filteredRecommendations = recommendations.filter(rec => 
    activeCategory === 'all' || rec.category === activeCategory
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Category selection */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {(['all', 'product', 'market', 'sales'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-glass)',
              background: activeCategory === cat ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.02)',
              color: activeCategory === cat ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              textTransform: 'capitalize',
              transition: 'var(--transition-smooth)',
              boxShadow: activeCategory === cat ? '0 4px 15px rgba(59, 130, 246, 0.2)' : 'none'
            }}
          >
            {cat} Recommendations
          </button>
        ))}
      </div>

      {/* Recommendations Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredRecommendations.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No recommendations generated.
          </div>
        ) : (
          filteredRecommendations.map((rec) => {
            const isExpanded = expandedIds.includes(rec.id);
            
            // Icon selection
            let IconComponent = Compass;
            let iconColor = '#3b82f6';
            if (rec.category === 'product') {
              IconComponent = Cpu;
              iconColor = '#06b6d4';
            } else if (rec.category === 'market') {
              IconComponent = Target;
              iconColor = '#a855f7';
            }

            return (
              <Card
                key={rec.id}
                style={{
                  cursor: 'pointer',
                  borderLeft: `4px solid ${
                    rec.priority === 'high' ? '#ef4444' : rec.priority === 'medium' ? '#f59e0b' : '#10b981'
                  }`,
                }}
                onClick={() => toggleExpand(rec.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--border-glass)'
                    }}>
                      <IconComponent size={20} style={{ color: iconColor }} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: iconColor }}>
                          {rec.category}
                        </span>
                        <Badge variant={rec.priority}>{rec.priority} Priority</Badge>
                      </div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '4px' }}>{rec.title}</h3>
                    </div>
                  </div>

                  <div style={{ color: 'var(--text-secondary)' }}>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>

                </div>

                <div style={{ 
                  marginTop: '12px', 
                  fontSize: '0.925rem', 
                  color: 'var(--text-secondary)',
                  borderTop: isExpanded ? '1px solid var(--border-glass)' : 'none',
                  paddingTop: isExpanded ? '12px' : '0'
                }}>
                  <p>{rec.description}</p>
                  
                  {isExpanded && (
                    <div style={{ 
                      marginTop: '12px', 
                      background: 'rgba(255, 255, 255, 0.02)', 
                      padding: '12px', 
                      borderRadius: '8px',
                      border: '1px solid var(--border-glass)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                        <AlertCircle size={14} style={{ color: iconColor }} /> STRATEGIC REASONING
                      </div>
                      <p style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>{rec.reasoning}</p>
                    </div>
                  )}
                </div>

              </Card>
            );
          })
        )}
      </div>

    </div>
  );
};
