'use client';

import { motion } from 'framer-motion';

interface GlassPanelProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    animate?: boolean;
    delay?: number;
}

export default function GlassPanel({
    children,
    className = '',
    style = {},
    animate = false,
    delay = 0,
}: GlassPanelProps) {
    const combinedStyle: React.CSSProperties = {
        background: 'var(--glass)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid var(--glass-border)',
        borderRadius: '20px',
        padding: '24px',
        ...style,
    };

    if (animate) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay }}
                style={combinedStyle}
                className={`glass-panel ${className}`}
            >
                {children}
            </motion.div>
        );
    }

    return (
        <div style={combinedStyle} className={`glass-panel ${className}`}>
            {children}
        </div>
    );
}
