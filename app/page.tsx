'use client';

import React, { useState, useEffect } from 'react';
import { LandingView } from '@/components/landing/LandingView';
import { AnalysisDashboard } from '@/components/analysis/AnalysisDashboard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Spinner, ProgressBar } from '@/components/ui';
import { AnalysisResult } from '@/lib/types';
import { AlertTriangle, ShieldCheck, Search, Database, FileSignature } from 'lucide-react';

const LOADING_STEPS = [
  { percent: 15, text: "Launching Tavily web crawling engine...", icon: Search },
  { percent: 45, text: "Scanning pricing models and features...", icon: Database },
  { percent: 75, text: "Compiling competitive feature matrices...", icon: ShieldCheck },
  { percent: 95, text: "Formulating ICP lead generation targets...", icon: FileSignature },
];

export default function Home() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'completed' | 'error'>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Loading progress states
  const [progress, setProgress] = useState(0);
  const [currentStepText, setCurrentStepText] = useState('');

  // Handle progress animation during loading state
  useEffect(() => {
    if (status !== 'loading') return;

    setProgress(5);
    setCurrentStepText(LOADING_STEPS[0].text);

    const interval = setInterval(() => {
      setProgress((prev) => {
        const nextProgress = prev + Math.floor(Math.random() * 8) + 2;
        
        // Update step text based on progress
        const matchingStep = [...LOADING_STEPS]
          .reverse()
          .find((step) => nextProgress >= step.percent);
          
        if (matchingStep) {
          setCurrentStepText(matchingStep.text);
        }

        if (nextProgress >= 98) {
          clearInterval(interval);
          return 98;
        }
        return nextProgress;
      });
    }, 400);

    return () => clearInterval(interval);
  }, [status]);

  const handleSubmitAnalysis = async (formData: {
    productName: string;
    description: string;
    websiteUrl: string;
    companyName: string;
  }) => {
    setStatus('loading');
    setErrorMsg('');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error || 'Competitor Analysis request failed.');
      }

      const data = await response.json();
      setResult(data);
      setProgress(100);
      
      // Delay transition slightly to let user see 100% completion
      setTimeout(() => {
        setStatus('completed');
      }, 500);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred during competitor analysis.');
      setStatus('error');
    }
  };

  const handleReset = () => {
    setResult(null);
    setStatus('idle');
    setProgress(0);
    setErrorMsg('');
  };

  // 1. LOADING SCREEN
  if (status === 'loading') {
    const ActiveStepIcon = [...LOADING_STEPS]
      .reverse()
      .find((step) => progress >= step.percent)?.icon || Search;

    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <Card style={{ maxWidth: '480px', width: '100%', padding: '40px 32px', textAlign: 'center', alignItems: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            marginBottom: '24px',
            animation: 'pulseGlow 2s infinite'
          }}>
            <ActiveStepIcon size={28} className="spin-slow" />
          </div>

          <CardHeader>
            <CardTitle>Nexus Intelligence Agent</CardTitle>
            <CardDescription style={{ marginTop: '4px' }}>
              Gathering real-time market data & preparing insights
            </CardDescription>
          </CardHeader>

          <CardContent style={{ width: '100%', margin: '24px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <ProgressBar value={progress} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span style={{ fontWeight: 600 }}>{currentStepText}</span>
              <span style={{ fontWeight: 700 }}>{progress}%</span>
            </div>
          </CardContent>

          <style>{`
            .spin-slow {
              animation: pulseGlow 1.5s ease-in-out infinite;
            }
          `}</style>
        </Card>
      </div>
    );
  }

  // 2. ERROR SCREEN
  if (status === 'error') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <Card style={{ maxWidth: '480px', width: '100%', padding: '32px', textAlign: 'center', alignItems: 'center' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444',
            marginBottom: '20px'
          }}>
            <AlertTriangle size={24} />
          </div>

          <CardHeader>
            <CardTitle>Analysis Failed</CardTitle>
            <CardDescription style={{ marginTop: '4px', color: '#ef4444' }}>
              {errorMsg}
            </CardDescription>
          </CardHeader>

          <CardContent style={{ margin: '20px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Please check your internet connection, verify your input fields, and ensure your API keys (Tavily/Groq) are correctly set.
          </CardContent>

          <button onClick={handleReset} className="btn btn-primary" style={{ width: '100%' }}>
            Go Back & Try Again
          </button>
        </Card>
      </div>
    );
  }

  // 3. COMPLETED VIEW
  if (status === 'completed' && result) {
    return <AnalysisDashboard result={result} onReset={handleReset} />;
  }

  // 4. IDLE LANDING VIEW
  return <LandingView onSubmit={handleSubmitAnalysis} isLoading={false} />;
}
