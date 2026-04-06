'use client';

import Header from '@/components/Header';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface AdminPageLayoutProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    backPath?: string | null;
    backText?: string;
    actions?: React.ReactNode;
    maxWidth?: string;
}

export default function AdminPageLayout({
    children,
    title,
    subtitle,
    backPath,
    backText = 'Voltar ao Painel',
    actions,
    maxWidth = '1250px',
}: AdminPageLayoutProps) {
    return (
        <main className="admin-layout">
            <Header />
            <section style={{ maxWidth, margin: '0 auto', padding: '0 20px' }}>
                {backPath && (
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{ marginBottom: "12px" }}
                    >
                        <Link 
                            href={backPath} 
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px', 
                                color: 'var(--text-muted)', 
                                textDecoration: 'none', 
                                fontSize: '0.9rem', 
                                width: 'fit-content',
                                transition: 'color 0.2s'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                        >
                            <ChevronLeft size={16} /> {backText}
                        </Link>
                    </motion.div>
                )}

                {(title || actions) && (
                    <div className="admin-header" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '20px',
                        marginBottom: '32px',
                        flexWrap: 'wrap'
                    }}>
                        <div>
                            {title && (
                                <h1 className="brand title-md" style={{ margin: 0, color: 'var(--primary)' }}>
                                    {title}
                                </h1>
                            )}
                            {subtitle && (
                                <p className="text-sm" style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                                    {subtitle}
                                </p>
                            )}
                        </div>
                        {actions && (
                            <div style={{ 
                                display: 'flex', 
                                gap: '12px', 
                                alignItems: 'center', 
                                flexWrap: 'wrap', 
                                flex: 1, 
                                justifyContent: 'flex-end' 
                            }}>
                                {actions}
                            </div>
                        )}
                    </div>
                )}

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    {children}
                </motion.div>
            </section>
        </main>
    );
}
