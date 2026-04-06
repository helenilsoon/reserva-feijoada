'use client';

import { LucideIcon } from 'lucide-react';

interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'info' | 'warning';
    icon?: LucideIcon;
    iconSize?: number;
    loading?: boolean;
    fullWidth?: boolean;
}

export default function AdminButton({
    children,
    variant = 'primary',
    icon: Icon,
    iconSize = 18,
    loading = false,
    fullWidth = false,
    className = '',
    style = {},
    ...props
}: AdminButtonProps) {
    const getVariantStyles = (): React.CSSProperties => {
        switch (variant) {
            case 'primary':
                return {
                    background: 'var(--primary)',
                    color: '#1a1410',
                    border: 'none',
                };
            case 'secondary':
                return {
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--glass-border)',
                };
            case 'danger':
                return {
                    background: 'rgba(231,76,60,0.1)',
                    color: '#e74c3c',
                    border: '1px solid rgba(231,76,60,0.3)',
                };
            case 'success':
                return {
                    background: 'rgba(37,211,102,0.15)',
                    color: '#25d366',
                    border: '1px solid rgba(37,211,102,0.3)',
                };
            case 'warning':
                return {
                    background: 'rgba(212,160,23,0.15)',
                    color: 'var(--primary)',
                    border: '1px solid rgba(212,160,23,0.3)',
                };
            case 'info':
                return {
                    background: 'rgba(0,123,255,0.15)',
                    color: '#007bff',
                    border: '1px solid rgba(0,123,255,0.3)',
                };
            case 'ghost':
                return {
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    border: 'none',
                };
            default:
                return {};
        }
    };

    const combinedStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '12px 18px',
        borderRadius: '12px',
        fontSize: '0.9rem',
        fontWeight: 600,
        cursor: loading ? 'not-allowed' : 'pointer',
        width: fullWidth ? '100%' : 'auto',
        transition: 'all 0.2s ease',
        ...getVariantStyles(),
        ...style,
    };

    return (
        <button
            style={combinedStyle}
            disabled={loading || props.disabled}
            className={`admin-btn ${className}`}
            {...props}
        >
            {loading ? (
                <div style={{ 
                    width: '18px', 
                    height: '18px', 
                    border: '2px solid rgba(255,255,255,0.1)', 
                    borderTopColor: 'currentColor', 
                    borderRadius: '50%', 
                    animation: 'spin 1s linear infinite' 
                }} />
            ) : (
                <>
                    {Icon && <Icon size={iconSize} />}
                    {children}
                </>
            )}
        </button>
    );
}
