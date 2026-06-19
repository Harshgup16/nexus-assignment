import React from 'react';

// CARD COMPONENTS
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}
export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => (
  <div className={`glass-panel ${className}`} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }} {...props}>
    {children}
  </div>
);

export const CardHeader: React.FC<CardProps> = ({ children, className = '', ...props }) => (
  <div className={`card-header ${className}`} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, className = '', ...props }) => (
  <h3 className={`card-title ${className}`} style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ children, className = '', ...props }) => (
  <p className={`card-description ${className}`} style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<CardProps> = ({ children, className = '', ...props }) => (
  <div className={`card-content ${className}`} style={{ flex: 1 }} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<CardProps> = ({ children, className = '', ...props }) => (
  <div className={`card-footer ${className}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }} {...props}>
    {children}
  </div>
);

// BUTTON COMPONENT
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  children: React.ReactNode;
}
export const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, className = '', ...props }) => {
  const btnClass = variant === 'primary' ? 'btn-primary' : variant === 'danger' ? 'btn-danger' : 'btn-secondary';
  // inline override styles for danger button (using danger gradient)
  const style = variant === 'danger' ? { background: 'var(--danger-gradient)', color: '#fff', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)' } : {};
  return (
    <button className={`btn ${btnClass} ${className}`} style={style} {...props}>
      {children}
    </button>
  );
};

// BADGE COMPONENT
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'verified' | 'inferred' | 'assumption' | 'high' | 'medium' | 'low' | 'neutral';
  children: React.ReactNode;
}
export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', children, className = '', ...props }) => {
  let badgeClass = '';
  switch (variant) {
    case 'verified': badgeClass = 'badge-verified'; break;
    case 'inferred': badgeClass = 'badge-inferred'; break;
    case 'assumption': badgeClass = 'badge-assumption'; break;
    case 'high': badgeClass = 'badge-high'; break;
    case 'medium': badgeClass = 'badge-medium'; break;
    case 'low': badgeClass = 'badge-low'; break;
    default: badgeClass = '';
  }
  const defaultStyle = variant === 'neutral' ? { background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid var(--border-glass)' } : {};
  return (
    <span className={`badge ${badgeClass} ${className}`} style={defaultStyle} {...props}>
      {children}
    </span>
  );
};

// TABS COMPONENTS
const TabsContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
} | null>(null);

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}
export const Tabs: React.FC<TabsProps> = ({ value, onValueChange, children }) => {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className="tabs-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

export const TabsList: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="tabs-list glass-panel" style={{ display: 'flex', gap: '8px', padding: '6px', borderRadius: '12px' }}>
    {children}
  </div>
);

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
}
export const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, children }) => {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('TabsTrigger must be used within a Tabs component');
  }
  const isActive = context.value === value;
  const style: React.CSSProperties = {
    flex: 1,
    padding: '10px 16px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.9rem',
    textAlign: 'center',
    transition: 'var(--transition-smooth)',
    background: isActive ? 'var(--primary-gradient)' : 'transparent',
    color: isActive ? '#fff' : 'var(--text-secondary)',
    boxShadow: isActive ? '0 4px 15px rgba(59, 130, 246, 0.2)' : 'none',
  };
  return (
    <button style={style} onClick={() => context.onValueChange(value)}>
      {children}
    </button>
  );
};

export const TabsContent: React.FC<{ value: string; children: React.ReactNode }> = ({ value, children }) => {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('TabsContent must be used within a Tabs component');
  }
  if (value !== context.value) return null;
  return <div className="tabs-content" style={{ animation: 'fadeIn 0.4s ease' }}>{children}</div>;
};

// SPINNER COMPONENT
export const Spinner: React.FC = () => (
  <div className="spinner" style={{
    width: '40px',
    height: '40px',
    border: '4px solid rgba(59, 130, 246, 0.1)',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  }}>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// PROGRESS BAR COMPONENT
export const ProgressBar: React.FC<{ value: number; max?: number }> = ({ value, max = 100 }) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  return (
    <div className="progress-bar-container" style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
      <div className="progress-bar-fill" style={{
        height: '100%',
        width: `${percentage}%`,
        background: 'var(--primary-gradient)',
        transition: 'width 0.4s ease',
        boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
      }} />
    </div>
  );
};
