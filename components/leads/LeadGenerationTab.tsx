'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button, Badge } from '../ui';
import { Lead } from '@/lib/types';
import { Search, Download, ExternalLink, Mail, Users, MapPin, Building } from 'lucide-react';

const Linkedin = ({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

interface Props {
  leads: Lead[];
}

export const LeadGenerationTab: React.FC<Props> = ({ leads }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('All');

  // Extract unique industries for filtering
  const industries = ['All', ...Array.from(new Set(leads.map(l => l.industry)))];

  // Filter leads based on search term and selected industry
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesIndustry = selectedIndustry === 'All' || lead.industry === selectedIndustry;
    
    return matchesSearch && matchesIndustry;
  });

  // Export to CSV function
  const handleExportCSV = () => {
    if (filteredLeads.length === 0) return;

    const headers = [
      'Company Name',
      'Website',
      'Industry',
      'Employee Size',
      'Location',
      'Contact Person',
      'Job Title',
      'Business Email',
      'LinkedIn Profile',
      'Additional Info',
      'Confidence Score'
    ];

    const rows = filteredLeads.map(l => [
      `"${l.companyName.replace(/"/g, '""')}"`,
      `"${l.website}"`,
      `"${l.industry}"`,
      `"${l.employeeSize}"`,
      `"${l.location.replace(/"/g, '""')}"`,
      `"${l.contactPerson.replace(/"/g, '""')}"`,
      `"${l.jobTitle.replace(/"/g, '""')}"`,
      `"${l.email || ''}"`,
      `"${l.linkedin || ''}"`,
      `"${(l.additionalInfo || '').replace(/"/g, '""')}"`,
      l.confidenceScore
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leads_nexus_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Search & Filters */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '300px' }}>
          
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }}>
              <Search size={16} />
            </span>
            <input
              type="text"
              className="text-input"
              style={{ paddingLeft: '36px' }}
              placeholder="Search leads by company, contact name, or job title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="text-input"
            style={{ width: '180px', cursor: 'pointer' }}
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
          >
            {industries.map((ind, i) => (
              <option key={i} value={ind}>{ind}</option>
            ))}
          </select>

        </div>

        <Button variant="secondary" onClick={handleExportCSV} disabled={filteredLeads.length === 0}>
          <Download size={16} /> Export CSV
        </Button>
      </div>

      {/* Main List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px' }}>
        {filteredLeads.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No leads found matching your current filters.
          </div>
        ) : (
          filteredLeads.map((lead, idx) => (
            <Card key={idx} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              
              <CardHeader>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {lead.companyName}
                      <a href={lead.website} target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', display: 'inline-flex' }}>
                        <ExternalLink size={14} />
                      </a>
                    </CardTitle>
                    <CardDescription style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                      <Building size={14} /> {lead.industry}
                    </CardDescription>
                  </div>
                  <Badge variant={lead.confidenceScore > 80 ? 'verified' : lead.confidenceScore > 65 ? 'inferred' : 'assumption'}>
                    {lead.confidenceScore}% Match
                  </Badge>
                </div>
              </CardHeader>

              <CardContent style={{ margin: '16px 0', display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-glass)', borderBottom: '1px solid var(--border-glass)', padding: '16px 0' }}>
                
                {/* Decision Maker */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Decision Maker</span>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: '2px', color: 'var(--text-primary)' }}>{lead.contactPerson}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{lead.jobTitle}</div>
                  
                  <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                    {lead.email && (
                      <a href={`mailto:${lead.email}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#3b82f6', textDecoration: 'none' }}>
                        <Mail size={12} /> Email Contact
                      </a>
                    )}
                    {lead.linkedin && (
                      <a href={lead.linkedin} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#06b6d4', textDecoration: 'none' }}>
                        <Linkedin size={12} /> LinkedIn Profile
                      </a>
                    )}
                  </div>
                </div>

                {/* Company Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                    <Users size={14} style={{ color: 'var(--text-muted)' }} />
                    <span>Size: {lead.employeeSize}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                    <MapPin size={14} style={{ color: 'var(--text-muted)' }} />
                    <span>Location: {lead.location}</span>
                  </div>
                </div>

                {/* Additional Insight */}
                {lead.additionalInfo && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    &ldquo;{lead.additionalInfo}&rdquo;
                  </p>
                )}

              </CardContent>

              <CardFooter style={{ justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>Sources: {lead.sources.join(', ')}</span>
              </CardFooter>

            </Card>
          ))
        )}
      </div>

    </div>
  );
};
