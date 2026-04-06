'use client';

import { ReactNode } from 'react';
import AdminButton from '@/components/admin/AdminButton';
import GlassPanel from '@/components/admin/GlassPanel';

interface AdminEmptyStateProps {
    icon?: string;
    message: string;
    onClear?: () => void;
    clearLabel?: string;
    action?: ReactNode;
}

export default function AdminEmptyState({
    icon = '📭',
    message,
    onClear,
    clearLabel = 'Limpar busca',
    action,
}: AdminEmptyStateProps) {
    return (
        <GlassPanel style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.3 }}>{icon}</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '20px' }}>
                {message}
            </p>
            {onClear && (
                <AdminButton
                    variant="ghost"
                    onClick={onClear}
                    style={{ textDecoration: 'underline', fontSize: '0.9rem' }}
                >
                    {clearLabel}
                </AdminButton>
            )}
            {action && action}
        </GlassPanel>
    );
}
