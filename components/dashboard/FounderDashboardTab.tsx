'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button } from '../ui';
import { DashboardData } from '@/lib/types';
import { Play, Flame, UserCheck, Eye, ClipboardList, CheckSquare, Square, Mail, ArrowUpRight } from 'lucide-react';

interface Props {
  dashboard: DashboardData;
  onNavigateTab: (tabIndex: string) => void;
}

export const FounderDashboardTab: React.FC<Props> = ({ dashboard, onNavigateTab }) => {
  // Checkbox state for actions
  const [completedTasks, setCompletedTasks] = useState<number[]>([]);

  const toggleTask = (index: number) => {
    if (completedTasks.includes(index)) {
      setCompletedTasks(completedTasks.filter(i => i !== index));
    } else {
      setCompletedTasks([...completedTasks, index]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* 1. HERO STATS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        
        <Card style={{ borderLeft: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>BUILD NEXT</span>
            <ClipboardList size={18} style={{ color: '#3b82f6' }} />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '8px' }}>{dashboard.whatToBuildNext[0].featureName}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>Impact: High</div>
        </Card>

        <Card style={{ borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>PRIMARY THREAT</span>
            <Flame size={18} style={{ color: '#ef4444' }} />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '8px' }}>{dashboard.biggestThreats[0].competitorName}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>Level: Critical</div>
        </Card>

        <Card style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>TOP CONTACT</span>
            <UserCheck size={18} style={{ color: '#10b981' }} />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '8px' }}>{dashboard.leadsToContactFirst[0].contactPerson}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>{dashboard.leadsToContactFirst[0].companyName}</div>
        </Card>

        <Card style={{ borderLeft: '4px solid #a855f7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>BEST OPPORTUNITY</span>
            <Eye size={18} style={{ color: '#a855f7' }} />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '8px' }}>{dashboard.missingOpportunities[0].title}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>Valued at: {dashboard.missingOpportunities[0].potentialValue}</div>
        </Card>

      </div>

      {/* 2. DUAL COLUMN DETAILS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '32px' }}>
        
        {/* WHAT SHOULD I BUILD NEXT? */}
        <Card>
          <CardHeader>
            <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Play size={18} style={{ color: '#3b82f6' }} />
              What Should I Build Next?
            </CardTitle>
            <CardDescription>Top features prioritized by competitive analysis and gaps</CardDescription>
          </CardHeader>
          <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
            {dashboard.whatToBuildNext.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', paddingBottom: '12px', borderBottom: idx !== dashboard.whatToBuildNext.length - 1 ? '1px solid var(--border-glass)' : 'none' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, flexShrink: 0 }}>
                  {idx + 1}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.featureName}</h4>
                    <Badge variant={item.impact}>{item.impact} impact</Badge>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{item.reasoning}</p>
                </div>
              </div>
            ))}
            <Button variant="secondary" style={{ width: '100%', marginTop: '8px' }} onClick={() => onNavigateTab('competitors')}>
              View Feature Matrix <ArrowUpRight size={14} />
            </Button>
          </CardContent>
        </Card>

        {/* ACTIONS TODAY CHECKLIST */}
        <Card>
          <CardHeader>
            <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ClipboardList size={18} style={{ color: '#06b6d4' }} />
              What Actions Should I Take Today?
            </CardTitle>
            <CardDescription>Direct recommendations generated to capture market gaps today</CardDescription>
          </CardHeader>
          <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
            {dashboard.actionsToday.map((item, idx) => {
              const isCompleted = completedTasks.includes(idx);
              return (
                <div
                  key={idx}
                  onClick={() => toggleTask(idx)}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                    padding: '12px',
                    borderRadius: '8px',
                    background: isCompleted ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-glass)',
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <div style={{ color: isCompleted ? '#10b981' : 'var(--text-muted)', display: 'flex' }}>
                    {isCompleted ? <CheckSquare size={18} /> : <Square size={18} />}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      textDecoration: isCompleted ? 'line-through' : 'none',
                      color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)'
                    }}>{item.task}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.context}</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* BIGGEST THREATS RADAR */}
        <Card>
          <CardHeader>
            <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={18} style={{ color: '#ef4444' }} />
              Which Competitors Are the Biggest Threat?
            </CardTitle>
            <CardDescription>Competitive threat scoring derived from positioning index</CardDescription>
          </CardHeader>
          <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
            {dashboard.biggestThreats.map((threat, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '12px', borderBottom: idx !== dashboard.biggestThreats.length - 1 ? '1px solid var(--border-glass)' : 'none' }}>
                <div>
                  <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>{threat.competitorName}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{threat.reasoning}</p>
                </div>
                <Badge variant={threat.threatLevel === 'critical' || threat.threatLevel === 'high' ? 'high' : threat.threatLevel === 'medium' ? 'medium' : 'low'}>
                  {threat.threatLevel}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* LEADS TO CONTACT FIRST */}
        <Card>
          <CardHeader>
            <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={18} style={{ color: '#10b981' }} />
              Which Leads Should I Contact First?
            </CardTitle>
            <CardDescription>High-scoring contacts identified for immediate sales outreach</CardDescription>
          </CardHeader>
          <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
            {dashboard.leadsToContactFirst.map((lead, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: idx !== dashboard.leadsToContactFirst.length - 1 ? '1px solid var(--border-glass)' : 'none' }}>
                <div>
                  <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>{lead.contactPerson}</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{lead.jobTitle} at {lead.companyName}</span>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>Reason: {lead.reasonToContact}</p>
                </div>
                <Button variant="secondary" onClick={() => onNavigateTab('leads')}>
                  <Mail size={12} /> Contact
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* MISSING OPPORTUNITIES FEED */}
        <Card style={{ gridColumn: '1 / -1' }}>
          <CardHeader>
            <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Eye size={18} style={{ color: '#a855f7' }} />
              What Opportunities Am I Missing?
            </CardTitle>
            <CardDescription>High-value revenue streams and market gaps with strategic priority</CardDescription>
          </CardHeader>
          <CardContent style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '12px' }}>
            {dashboard.missingOpportunities.map((op, idx) => (
              <div key={idx} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '8px' }}>
                <div>
                  <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{op.title}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{op.description}</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid var(--border-glass)', paddingTop: '10px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Est. Value</span>
                  <Badge variant="verified">{op.potentialValue}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

      </div>

    </div>
  );
};
