'use client';

interface AdminLoadingStateProps {
    message?: string;
}

export default function AdminLoadingState({ message = 'Carregando...' }: AdminLoadingStateProps) {
    return (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
            {/* Spinner ring */}
            <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid rgba(212,160,23,0.15)',
                borderTop: '3px solid var(--primary)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 20px',
            }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{message}</p>
        </div>
    );
}
