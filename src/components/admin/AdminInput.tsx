'use client';

import { LucideIcon } from 'lucide-react';

interface AdminInputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement> {
    label?: string;
    icon?: LucideIcon;
    fullWidth?: boolean;
    containerStyle?: React.CSSProperties;
    as?: 'input' | 'select';
}

export default function AdminInput({
    label,
    icon: Icon,
    fullWidth = true,
    containerStyle = {},
    as: Component = 'input',
    children,
    ...props
}: AdminInputProps) {
    const inputStyle: React.CSSProperties = {
        width: fullWidth ? '100%' : 'auto',
        padding: Icon ? '14px 14px 14px 44px' : '14px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid var(--glass-border)',
        borderRadius: '14px',
        color: 'white',
        fontSize: '0.9rem',
        transition: 'all 0.25s ease',
        ...props.style
    };

    const containerStyles: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        width: fullWidth ? '100%' : 'auto',
        position: 'relative',
        ...containerStyle
    };

    const labelStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '0.85rem',
        color: 'var(--text-muted)',
    };

    return (
        <div style={containerStyles}>
            {label && (
                <label style={labelStyle}>
                    {Icon && <Icon size={16} />} 
                    {label}
                </label>
            )}
            <div style={{ position: 'relative' }}>
                {!label && Icon && (
                    <Icon size={18} style={{ 
                        position: 'absolute', 
                        left: '16px', 
                        top: '50%', 
                        transform: 'translateY(-50%)', 
                        opacity: 0.3 
                    }} />
                )}
                {/* @ts-ignore */}
                <Component
                    {...props}
                    style={inputStyle}
                    className={`admin-input ${props.className || ''}`}
                >
                    {children}
                </Component>
            </div>
        </div>
    );
}
