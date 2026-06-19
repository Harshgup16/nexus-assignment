'use client';

import React, { useState, useEffect } from 'react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '../ui';
import { AnalysisResult } from '@/lib/types';
import {
  ArrowLeft,
  Download,
  ExternalLink,
  Calendar,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Target,
  CheckCircle,
  Lightbulb,
  ArrowUpRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  LabelList,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts';

interface Props {
  result: AnalysisResult;
  onReset: () => void;
}

const renderMarkdown = (text: string): React.ReactNode => {
  if (!text) return null;

  // Split text by lines
  const lines = text.split('\n');

  return lines.map((line, lineIdx) => {
    // Regex matches: **bold**, *italic*, `code`, [text](url)
    const regex = /(\*\*.*?\*\*|\*.*?\*|\[.*?\]\(.*?\)|\`.*?\`)/g;
    const parts = line.split(regex);

    const parsed = parts.map((part, partIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={partIdx} style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={partIdx} style={{ fontStyle: 'italic' }}>{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={partIdx} style={{ background: 'rgba(255,255,255,0.07)', padding: '2px 4px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.9em' }}>{part.slice(1, -1)}</code>;
      }
      if (part.startsWith('[') && part.includes('](')) {
        const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
        if (linkMatch) {
          const [_, linkText, linkUrl] = linkMatch;
          return <a key={partIdx} href={linkUrl} target="_blank" rel="noreferrer" style={{ color: '#818cf8', textDecoration: 'underline' }}>{linkText}</a>;
        }
      }
      return part;
    });

    return (
      <span key={lineIdx}>
        {parsed}
        {lineIdx < lines.length - 1 && <br />}
      </span>
    );
  });
};

export const AnalysisDashboard: React.FC<Props> = ({ result, onReset }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'roadmap' | 'competitors' | 'leads' | 'recommendations'>('roadmap');

  useEffect(() => {
    setMounted(true);
  }, []);

  const isTabActive = (tabName: 'roadmap' | 'competitors' | 'leads' | 'recommendations') => {
    return isExporting || activeTab === tabName;
  };

  // Format pricing data for charts
  const pricingData = result.competitors.map(c => {
    const starterPlan = c.pricing.find(p => p.name.toLowerCase().includes('starter') || p.name.toLowerCase().includes('basic') || p.name.toLowerCase().includes('starter plan'));
    const priceStr = starterPlan ? starterPlan.price.replace(/[^0-9]/g, '') : '';
    const price = priceStr ? parseInt(priceStr) : 29; // fallback
    return {
      name: c.name,
      price: price,
      displayPrice: starterPlan ? starterPlan.price : '$29',
      period: starterPlan ? starterPlan.period : 'monthly'
    };
  });

  const fullPricingData = [
    { name: 'Our Product', price: 49, displayPrice: '$49', period: 'monthly' },
    ...pricingData
  ];

  // Scatter plot data (Positioning map: Innovation vs Market Share/Presence)
  const positioningData = result.competitors.map((c, idx) => {
    const innovation = 40 + (c.confidenceScore % 45) + (idx * 5);
    const marketPresence = 30 + (idx * 12) + (c.pricing.length * 10);
    return {
      name: c.name,
      x: innovation, // Innovation Index
      y: marketPresence, // Market Share / Presence Index
      z: c.confidenceScore
    };
  });

  const fullPositioningData = [
    { name: 'Our Product', x: 88, y: 35, z: 95 },
    ...positioningData
  ];

  // Radar chart data for Market Landscape overview
  const radarData = [
    { subject: 'Feature Completeness', 'Our Product': 85, 'Avg Competitor': 60 },
    { subject: 'Pricing Flexibility', 'Our Product': 90, 'Avg Competitor': 75 },
    { subject: 'Data Accuracy', 'Our Product': 95, 'Avg Competitor': 70 },
    { subject: 'API Reliability', 'Our Product': 80, 'Avg Competitor': 65 },
    { subject: 'Customer Success', 'Our Product': 75, 'Avg Competitor': 80 },
  ];

  // Feature gap analysis: What percentage of competitors support these features?
  const featureGaps = result.featureComparison.rows.map(row => {
    const totalComps = Object.keys(row.competitors).length;
    const compsWithFeature = Object.values(row.competitors).filter(v => v).length;
    const adoptionRate = Math.round((compsWithFeature / totalComps) * 100);
    return {
      name: row.featureName,
      adoptionRate: adoptionRate,
      oursHasIt: row.ourProduct
    };
  });

  // CSV Export for Leads
  const handleExportCSV = () => {
    const headers = [
      'Company Name',
      'Website',
      'Industry',
      'Employee Size',
      'Location',
      'Contact Person',
      'Job Title',
      'LinkedIn',
      'Email',
      'Additional Info',
      'Confidence Score'
    ];
    
    const rows = result.leads.map(lead => [
      lead.companyName,
      lead.website,
      lead.industry,
      lead.employeeSize,
      lead.location,
      lead.contactPerson,
      lead.jobTitle,
      lead.linkedin || '',
      lead.email || '',
      lead.additionalInfo || '',
      `${lead.confidenceScore}%`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `nexus_leads_${result.input.productName.toLowerCase().replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Export
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const element = document.getElementById('nexus-dashboard-export');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#141414',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`nexus_${result.input.productName.toLowerCase().replace(/\s+/g, '_')}_analysis.pdf`);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="nexus-container">
      
      {/* Back & Export Buttons */}
      <div className="dashboard-header-row">
        <button
          onClick={onReset}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={16} /> Run New Analysis
        </button>

        <Button variant="secondary" onClick={handleExportPDF} disabled={isExporting}>
          <Download size={16} /> {isExporting ? 'Exporting...' : 'Export PDF'}
        </Button>
      </div>

      {/* Main Report Container */}
      <div id="nexus-dashboard-export" style={{ display: 'flex', flexDirection: 'column', gap: '32px', padding: '20px 0' }}>
        
        {/* Banner */}
        <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#818cf8', marginBottom: '8px' }}>
            <Sparkles size={16} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Analysis Complete</span>
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            {result.input.productName || 'Startup Concept'}
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginTop: '12px', whiteSpace: 'pre-wrap' }}>
            {renderMarkdown(result.input.description)}
          </p>
          <div style={{ display: 'flex', gap: '24px', marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <div>
              <strong>Analyzed On:</strong> {new Date(result.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            {result.input.websiteUrl && (
              <div>
                <strong>Website:</strong> <a href={result.input.websiteUrl} target="_blank" rel="noreferrer" style={{ color: '#818cf8', textDecoration: 'none' }}>{result.input.websiteUrl}</a>
              </div>
            )}
          </div>
        </div>

        {/* Modular Segmented Sub-Tab Switcher */}
        {!isExporting && (
          <div className="tab-switcher">
            <button 
              onClick={() => setActiveTab('roadmap')}
              className="tab-button"
              style={{
                background: activeTab === 'roadmap' ? '#252525' : 'transparent',
                color: activeTab === 'roadmap' ? '#c084fc' : 'var(--text-secondary)'
              }}
            >
              <CheckCircle size={15} />
              Roadmap & Checklist
            </button>
            <button 
              onClick={() => setActiveTab('competitors')}
              className="tab-button"
              style={{
                background: activeTab === 'competitors' ? '#252525' : 'transparent',
                color: activeTab === 'competitors' ? '#34d399' : 'var(--text-secondary)'
              }}
            >
              <TrendingUp size={15} />
              Competitors & Matrix
            </button>
            <button 
              onClick={() => setActiveTab('leads')}
              className="tab-button"
              style={{
                background: activeTab === 'leads' ? '#252525' : 'transparent',
                color: activeTab === 'leads' ? '#60a5fa' : 'var(--text-secondary)'
              }}
            >
              <Target size={15} />
              Target leads
            </button>
            <button 
              onClick={() => setActiveTab('recommendations')}
              className="tab-button"
              style={{
                background: activeTab === 'recommendations' ? '#252525' : 'transparent',
                color: activeTab === 'recommendations' ? '#a78bfa' : 'var(--text-secondary)'
              }}
            >
              <Lightbulb size={15} />
              Strategy Recommendations
            </button>
          </div>
        )}

        {/* 1. Action Items & Roadmap */}
        {isTabActive('roadmap') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', color: '#c084fc', margin: '0 0 20px 0' }}>
                <CheckCircle size={22} /> Action Items & Roadmap
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Actions Today */}
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 12px 0' }}>Immediate Action Items</h3>
                  <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', color: 'var(--text-secondary)' }}>
                    {result.dashboard.actionsToday.map((act, i) => (
                      <li key={i} style={{ lineHeight: '1.5' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{renderMarkdown(act.task)}</strong> <span style={{ fontSize: '0.8rem', padding: '2px 6px', borderRadius: '4px', background: act.priority === 'high' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', color: act.priority === 'high' ? '#f87171' : '#fbbf24', marginLeft: '8px', fontWeight: 600 }}>{act.priority.toUpperCase()}</span>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{renderMarkdown(act.context)}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* What to Build Next */}
                <div style={{ marginTop: '12px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 12px 0' }}>Product Development Roadmap</h3>
                  <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', color: 'var(--text-secondary)' }}>
                    {result.dashboard.whatToBuildNext.map((roadmap, i) => (
                      <li key={i} style={{ lineHeight: '1.5' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{renderMarkdown(roadmap.featureName)}</strong> <span style={{ fontSize: '0.8rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(59,130,246,0.1)', color: '#60a5fa', marginLeft: '8px', fontWeight: 600 }}>{roadmap.impact.toUpperCase()} IMPACT</span>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{renderMarkdown(roadmap.reasoning)}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Market Gaps & Threats */}
            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '28px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', color: '#f87171', margin: '0 0 20px 0' }}>
                <AlertTriangle size={22} /> Market Gaps & Risks
              </h2>

              <div className="gaps-threats-grid">
                {/* Missing Opportunities */}
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 12px 0' }}>Missing Market Opportunities</h3>
                  <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', color: 'var(--text-secondary)' }}>
                    {result.dashboard.missingOpportunities.map((opp, i) => (
                      <li key={i} style={{ lineHeight: '1.5' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{renderMarkdown(opp.title)}</strong>
                        <p style={{ margin: '2px 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{renderMarkdown(opp.description)}</p>
                        <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#fbbf24', fontWeight: 600 }}>Value Opportunity: {opp.potentialValue}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Biggest Threats */}
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 12px 0' }}>Biggest Market Threats</h3>
                  <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', color: 'var(--text-secondary)' }}>
                    {result.dashboard.biggestThreats.map((threat, i) => (
                      <li key={i} style={{ lineHeight: '1.5' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{renderMarkdown(threat.competitorName)}</strong> <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(239,68,68,0.1)', color: '#f87171', marginLeft: '6px', fontWeight: 600 }}>{threat.threatLevel.toUpperCase()} RISK</span>
                        <p style={{ margin: '2px 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{renderMarkdown(threat.reasoning)}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Competitor Analysis */}
        {isTabActive('competitors') && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', color: '#34d399', margin: '0 0 20px 0' }}>
              <TrendingUp size={22} /> Competitor Intelligence
            </h2>

            {/* Competitor list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {result.competitors.map((comp, i) => (
                <div key={i} style={{ borderBottom: i < result.competitors.length - 1 ? '1px dashed var(--border-glass)' : 'none', paddingBottom: '32px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      {comp.name}
                    </h3>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Confidence: {comp.confidenceScore}%</span>
                      <a href={comp.website.startsWith('http') ? comp.website : `https://${comp.website}`} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', textDecoration: 'none' }}>
                        Visit <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', margin: '12px 0 16px 0', lineHeight: '1.6' }}>
                    {renderMarkdown(comp.description)}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', fontSize: '0.9rem' }}>
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>Value Proposition & Positioning:</strong>
                      <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>{renderMarkdown(comp.valueProposition)}</p>
                      <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: '0.85rem' }}>Positioning: {renderMarkdown(comp.positioning)}</p>
                    </div>
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>Target Audience:</strong>
                      <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>{comp.targetAudience}</p>
                      <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: '0.85rem' }}>
                        Pricing: {comp.pricing.map(p => `${p.name} (${p.price}/${p.period})`).join(', ') || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="strengths-weaknesses-grid">
                    <div>
                      <strong style={{ color: '#34d399' }}>Key Strengths</strong>
                      <ul style={{ paddingLeft: '20px', margin: '4px 0 0 0', display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--text-secondary)' }}>
                        {comp.strengths.map((str, idx) => <li key={idx}>{str}</li>)}
                      </ul>
                    </div>
                    <div>
                      <strong style={{ color: '#f87171' }}>Key Weaknesses</strong>
                      <ul style={{ paddingLeft: '20px', margin: '4px 0 0 0', display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--text-secondary)' }}>
                        {comp.weaknesses.map((weak, idx) => <li key={idx}>{weak}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Feature Matrix */}
            <div style={{ marginTop: '40px', borderTop: '1px solid var(--border-glass)', paddingTop: '32px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 16px 0' }}>Feature Comparison Matrix</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-glass)' }}>
                      <th style={{ textAlign: 'left', padding: '12px 8px', color: 'var(--text-primary)' }}>Feature</th>
                      <th style={{ textAlign: 'center', padding: '12px 8px', color: '#34d399' }}>Our Product</th>
                      {result.featureComparison.competitorNames.map((name, i) => (
                        <th key={i} style={{ textAlign: 'center', padding: '12px 8px', color: 'var(--text-secondary)' }}>{name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.featureComparison.rows.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                        <td style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--text-primary)' }}>{row.featureName}</td>
                        <td style={{ textAlign: 'center', padding: '12px 8px', color: row.ourProduct ? '#34d399' : '#f87171', fontWeight: 700 }}>
                          {row.ourProduct ? '✓' : '✗'}
                        </td>
                        {result.featureComparison.competitorNames.map((compName, i) => (
                          <td key={i} style={{ textAlign: 'center', padding: '12px 8px', color: row.competitors[compName] ? '#34d399' : '#f87171' }}>
                            {row.competitors[compName] ? '✓' : '✗'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Interactive Visualizations */}
              <div style={{ marginTop: '40px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 20px 0' }}>Interactive Visualizations</h3>
                <div className="chart-grid">
                  {/* Pricing Comparison */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Pricing Comparison Chart</CardTitle>
                      <CardDescription>Estimated starting prices of starter/basic plans (USD/mo)</CardDescription>
                    </CardHeader>
                    <CardContent style={{ height: '280px', minHeight: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '10px' }}>
                      {!mounted ? (
                        <div style={{ width: '100%', height: '100%', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }} />
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={fullPricingData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                            <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                            <Tooltip 
                              contentStyle={{ background: '#1e1e1e', border: '1px solid var(--border-glass)', borderRadius: '8px' }} 
                              labelClassName="gradient-text" 
                            />
                            <Bar dataKey="price" fill="url(#blueCyanGradient)" radius={[4, 4, 0, 0]}>
                              <defs>
                                <linearGradient id="blueCyanGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#3b82f6" />
                                  <stop offset="100%" stopColor="#06b6d4" />
                                </linearGradient>
                              </defs>
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  {/* Competitor Positioning Scatter Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Competitor Positioning Graph</CardTitle>
                      <CardDescription>Innovation Index vs Market Share (Higher & further right is dominant)</CardDescription>
                    </CardHeader>
                    <CardContent style={{ height: '280px', minHeight: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '10px' }}>
                      {!mounted ? (
                        <div style={{ width: '100%', height: '100%', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }} />
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: -20 }}>
                            <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                            <XAxis type="number" dataKey="x" name="Innovation Index" unit="pts" stroke="var(--text-secondary)" fontSize={10} />
                            <YAxis type="number" dataKey="y" name="Market Presence" unit="%" stroke="var(--text-secondary)" fontSize={10} />
                            <ZAxis type="number" dataKey="z" range={[60, 400]} name="Confidence" />
                            <Tooltip 
                              cursor={{ strokeDasharray: '3 3' }}
                              contentStyle={{ background: '#1e1e1e', border: '1px solid var(--border-glass)', borderRadius: '8px' }}
                            />
                            <Scatter name="Competitors" data={fullPositioningData} fill="#a855f7">
                              <LabelList dataKey="name" position="top" style={{ fill: 'var(--text-primary)', fontSize: 9, fontWeight: 600 }} />
                            </Scatter>
                          </ScatterChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  {/* Market Landscape Overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Market Landscape Radar</CardTitle>
                      <CardDescription>Dimensions comparing Our Product with the average competitor benchmark</CardDescription>
                    </CardHeader>
                    <CardContent style={{ height: '280px', minHeight: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '10px' }}>
                      {!mounted ? (
                        <div style={{ width: '100%', height: '100%', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }} />
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="60%" data={radarData}>
                            <PolarGrid stroke="rgba(255,255,255,0.05)" />
                            <PolarAngleAxis dataKey="subject" stroke="var(--text-secondary)" fontSize={9} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="var(--text-muted)" fontSize={8} />
                            <Radar name="Our Product" dataKey="Our Product" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                            <Radar name="Avg Competitor" dataKey="Avg Competitor" stroke="#a855f7" fill="#a855f7" fillOpacity={0.2} />
                            <Legend wrapperStyle={{ fontSize: 9 }} />
                            <Tooltip contentStyle={{ background: '#1e1e1e', border: '1px solid var(--border-glass)', borderRadius: '8px' }} />
                          </RadarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  {/* Feature Gap Analysis */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Feature Gap Analysis Chart</CardTitle>
                      <CardDescription>Market Adoption Rates of Features (Highlighted red: features we are missing)</CardDescription>
                    </CardHeader>
                    <CardContent style={{ height: '280px', minHeight: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '10px' }}>
                      {!mounted ? (
                        <div style={{ width: '100%', height: '100%', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }} />
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={featureGaps} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis type="number" stroke="var(--text-secondary)" fontSize={9} domain={[0, 100]} unit="%" />
                            <YAxis dataKey="name" type="category" stroke="var(--text-secondary)" fontSize={9} width={90} />
                            <Tooltip contentStyle={{ background: '#1e1e1e', border: '1px solid var(--border-glass)', borderRadius: '8px' }} />
                            <Bar dataKey="adoptionRate" fill="#a855f7" radius={[0, 4, 4, 0]}>
                              {featureGaps.map((entry, index) => (
                                <rect
                                  key={`cell-${index}`}
                                  fill={entry.oursHasIt ? '#34d399' : '#f87171'}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. B2B Leads */}
        {isTabActive('leads') && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', color: '#60a5fa', margin: 0 }}>
                <Target size={22} /> Target B2B Leads & ICP Profiles
              </h2>
              <Button variant="secondary" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '8px 14px' }}>
                <Download size={14} /> Export CSV
              </Button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {result.leads.map((lead, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        {lead.companyName}
                      </h3>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{lead.industry} • {lead.location} • {lead.employeeSize} employees</span>
                    </div>
                    <span style={{ fontSize: '0.8rem', padding: '4px 8px', borderRadius: '6px', background: 'rgba(96,165,250,0.1)', color: '#60a5fa', fontWeight: 700 }}>
                      {lead.confidenceScore}% MATCH
                    </span>
                  </div>

                  <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', margin: '12px 0', lineHeight: '1.5' }}>
                    {renderMarkdown(lead.additionalInfo || `Perfect ICP match because they operate in the ${lead.industry} space.`)}
                  </p>

                  <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', fontSize: '0.85rem' }}>
                    <div>
                      <strong style={{ color: 'var(--text-muted)' }}>DECISION MAKER:</strong>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginTop: '2px' }}>{lead.contactPerson}</div>
                      <div style={{ color: 'var(--text-secondary)' }}>{lead.jobTitle}</div>
                    </div>
                    <div>
                      <strong style={{ color: 'var(--text-muted)' }}>CONTACT DETAILS:</strong>
                      <div style={{ marginTop: '2px' }}>
                        {lead.email && <span style={{ color: '#60a5fa', marginRight: '12px' }}>{lead.email}</span>}
                        {lead.linkedin && (
                          <a href={lead.linkedin} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                            LinkedIn <ArrowUpRight size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Strategic Recommendations */}
        {isTabActive('recommendations') && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', color: '#a78bfa', margin: '0 0 20px 0' }}>
              <Lightbulb size={22} /> Strategic Consultant Recommendations
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {['product', 'market', 'sales'].map((cat) => {
                const items = result.recommendations.filter(r => r.category === cat);
                return (
                  <div key={cat} style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '20px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize', margin: '0 0 12px 0' }}>
                      {cat} Strategy
                    </h3>
                    <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', color: 'var(--text-secondary)' }}>
                      {items.map((rec) => (
                        <li key={rec.id} style={{ lineHeight: '1.5' }}>
                          <strong style={{ color: 'var(--text-primary)' }}>{renderMarkdown(rec.title)}</strong>
                          <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', background: rec.priority === 'high' ? 'rgba(239,68,68,0.1)' : rec.priority === 'medium' ? 'rgba(245,158,11,0.1)' : 'rgba(99,102,241,0.1)', color: rec.priority === 'high' ? '#f87171' : rec.priority === 'medium' ? '#fbbf24' : '#818cf8', marginLeft: '8px', fontWeight: 600 }}>{rec.priority.toUpperCase()} PRIORITY</span>
                          <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{renderMarkdown(rec.description)}</p>
                          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Reasoning: {renderMarkdown(rec.reasoning)}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
