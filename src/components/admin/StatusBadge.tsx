'use client';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    className?: string;
    style?: React.CSSProperties;
}

export default function StatusBadge({
    children,
    variant = 'neutral',
    className = '',
    style = {},
}: StatusBadgeProps) {
    const getVariantStyles = (): React.CSSProperties => {
        switch (variant) {
            case 'success':
                return { background: 'rgba(37, 211, 102, 0.1)', color: '#25d366', border: '1px solid rgba(37, 211, 102, 0.2)' };
            case 'warning':
                return { background: 'rgba(212, 160, 23, 0.1)', color: 'var(--primary)', border: '1px solid rgba(212, 160, 23, 0.2)' };
            case 'danger':
                return { background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c', border: '1px solid rgba(231, 76, 60, 0.2)' };
            case 'info':
                return { background: 'rgba(0,123,255,0.1)', color: '#007bff', border: '1px solid rgba(0,123,255,0.2)' };
            case 'neutral':
                return { background: 'rgba(255, 255, 255, 0.05)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.1)' };
            default:
                return {};
        }
    };

    const combinedStyle: React.CSSProperties = {
        padding: '4px 12px',
        borderRadius: '99px',
        fontSize: '0.7rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        ...getVariantStyles(),
        ...style,
    };

    return (
        <span style={combinedStyle} className={`badge ${className}`}>
            {children}
        </span>
    );
}
