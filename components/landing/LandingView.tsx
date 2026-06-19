'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '../ui';
import { Sparkles, Globe, Briefcase, FileText, ArrowRight, Zap, Target, LineChart, HelpCircle, Building } from 'lucide-react';

interface Props {
  onSubmit: (data: {
    productName: string;
    description: string;
    websiteUrl: string;
    companyName: string;
  }) => void;
  isLoading: boolean;
}

export const LandingView: React.FC<Props> = ({ onSubmit, isLoading }) => {
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const hasName = !!productName.trim();
    const hasDesc = !!description.trim();
    const hasUrl = !!websiteUrl.trim();
    const hasCompany = !!companyName.trim();

    if (!hasName && !hasDesc && !hasUrl && !hasCompany) {
      setError('Please provide at least one input field (Product/Startup Name, Concept Description, Website URL, or Company Name) to begin analysis.');
      return;
    }

    if (hasName && productName.trim().length < 2) {
      setError('Product Name must be at least 2 characters.');
      return;
    }

    if (hasDesc && description.trim().length < 10) {
      setError('Concept Description must be at least 10 characters long to perform an accurate analysis.');
      return;
    }

    if (hasUrl && !/^https?:\/\/[^\s$.?#].[^\s]*$/i.test(websiteUrl.trim())) {
      setError('Website URL must be a valid URL starting with http:// or https://');
      return;
    }

    onSubmit({
      productName: productName.trim(),
      description: description.trim(),
      websiteUrl: websiteUrl.trim(),
      companyName: companyName.trim(),
    });
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '60px 20px', display: 'flex', flexDirection: 'column', gap: '60px' }}>
      
      {/* HERO HEADER SECTION */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
          Analyze Competitors & <br />
          <span className="gradient-text">Generate Quality Leads</span>
        </h1>
      </div>

      {/* TWO COLUMN FORM & PREVIEW SECTION */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '40px', alignItems: 'flex-start' }}>
        
        {/* INPUT FORM CARD */}
        <Card style={{ padding: '32px' }}>
          <CardHeader>
            <CardTitle>Launch Competitive Scan</CardTitle>
            <CardDescription>Tell us about your startup concept to begin research</CardDescription>
          </CardHeader>
          <CardContent style={{ marginTop: '20px' }}>
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div className="input-group">
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Briefcase size={14} /> Product / Startup Name
                </label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="e.g. Nexus CRM"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="input-group">
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={14} /> Concept Description
                </label>
                <textarea
                  className="textarea-input"
                  style={{ minHeight: '120px', resize: 'vertical' }}
                  placeholder="e.g. A competitor analysis and automated lead generation tool that allows SaaS startup founders to find customers and run pricing updates..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="input-group">
                  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Globe size={14} /> Website URL
                  </label>
                  <input
                    type="text"
                    className="text-input"
                    placeholder="https://nexus.io"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building size={14} /> Company Name
                  </label>
                  <input
                    type="text"
                    className="text-input"
                    placeholder="Nexus Labs"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {error && (
                <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>
                  {error}
                </div>
              )}

              <Button type="submit" disabled={isLoading} style={{ marginTop: '8px', padding: '14px 20px', fontSize: '1rem' }}>
                {isLoading ? 'Running Analysis...' : 'Generate Report'} <ArrowRight size={18} />
              </Button>

            </form>
          </CardContent>
        </Card>

        {/* PILLARS PREVIEW SECTION */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.1)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(168, 85, 247, 0.25)', flexShrink: 0 }}>
              <Zap size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>1. Real-time Competitor Scans</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                Our crawler conducts web queries using Tavily to identify at least 5 major competitors, pricing metrics, positioning vectors, and key features.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(59, 130, 246, 0.25)', flexShrink: 0 }}>
              <Target size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>2. Grounded B2B Sales Leads</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                Discover verified companies matching your ICP along with direct contact persons, email syntaxes, and decision-maker LinkedIn references.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(16, 185, 129, 0.25)', flexShrink: 0 }}>
              <LineChart size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>3. Strategic Priority Dashboard</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                Get an actionable breakdown of what features to code next, competitor threat maps, and customized daily operations checksheets.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
