'use client';

import AdminButton from '@/components/admin/AdminButton';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    loading?: boolean;
}

export default function Pagination({
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    onPageChange,
    loading = false,
}: PaginationProps) {
    if (totalPages <= 1) return null;

    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalItems);

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '20px',
            flexWrap: 'wrap',
            gap: '12px',
        }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Mostrando <strong style={{ color: 'var(--text)' }}>{start}–{end}</strong> de{' '}
                <strong style={{ color: 'var(--text)' }}>{totalItems}</strong> registros
            </span>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <AdminButton
                    variant="secondary"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1 || loading}
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                    icon={ChevronLeft}
                >
                    Anterior
                </AdminButton>

                {/* Page number bubbles */}
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let page: number;
                    if (totalPages <= 5) {
                        page = i + 1;
                    } else if (currentPage <= 3) {
                        page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                        page = totalPages - 4 + i;
                    } else {
                        page = currentPage - 2 + i;
                    }

                    return (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            disabled={loading}
                            style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '10px',
                                border: page === currentPage
                                    ? '1px solid var(--primary)'
                                    : '1px solid rgba(255,255,255,0.08)',
                                background: page === currentPage
                                    ? 'rgba(212,160,23,0.15)'
                                    : 'rgba(255,255,255,0.04)',
                                color: page === currentPage ? 'var(--primary)' : 'var(--text-muted)',
                                fontWeight: page === currentPage ? 700 : 400,
                                fontSize: '0.9rem',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            {page}
                        </button>
                    );
                })}

                <AdminButton
                    variant="secondary"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages || loading}
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                >
                    Próximo <ChevronRight size={16} style={{ marginLeft: '4px' }} />
                </AdminButton>
            </div>
        </div>
    );
}
