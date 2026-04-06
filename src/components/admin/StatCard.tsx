'use client';

import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatCardProps {
    label: string;
    value: string | number;
    subtext?: string;
    icon: LucideIcon;
    color?: string;
    onClick?: () => void;
    className?: string;
}

export default function StatCard({
    label,
    value,
    subtext,
    icon: Icon,
    color = 'var(--primary)',
    onClick,
    className = '',
}: StatCardProps) {
    const isClickable = !!onClick;

    return (
        <motion.div
            whileHover={isClickable ? { translateY: -4 } : {}}
            whileTap={isClickable ? { scale: 0.98 } : {}}
            onClick={onClick}
            className={`stat-card ${isClickable ? 'tap-feedback' : ''} ${className}`}
            style={{
                padding: '24px',
                borderRadius: '20px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                transition: 'all 0.3s ease',
                cursor: isClickable ? 'pointer' : 'default',
                textDecoration: 'none',
                maxWidth: '100%',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</p>
                <Icon size={18} color={color} style={{ opacity: 0.8 }} />
            </div>
            <h2 className="title-md" style={{ color, margin: 0 }}>{value}</h2>
            {subtext && <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>{subtext}</p>}
        </motion.div>
    );
}
