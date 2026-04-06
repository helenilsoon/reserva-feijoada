'use client';

import { ReactNode } from 'react';
import GlassPanel from '@/components/admin/GlassPanel';

// ─── Column Definition ──────────────────────────────────────────────────────

export interface ColumnDef<T> {
    key: string;
    header: string;
    align?: 'left' | 'center' | 'right';
    width?: string;
    render: (row: T) => ReactNode;
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface AdminDataTableProps<T> {
    columns: ColumnDef<T>[];
    data: T[];
    keyExtractor: (row: T) => string | number;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminDataTable<T>({
    columns,
    data,
    keyExtractor,
}: AdminDataTableProps<T>) {
    return (
        <GlassPanel style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                    <thead>
                        <tr style={{
                            borderBottom: '1px solid var(--glass-border)',
                            background: 'rgba(255,255,255,0.02)',
                        }}>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    style={{
                                        padding: '16px 20px',
                                        textAlign: col.align ?? 'left',
                                        color: 'var(--text-muted)',
                                        fontSize: '0.78rem',
                                        fontWeight: 700,
                                        letterSpacing: '0.08em',
                                        textTransform: 'uppercase',
                                        width: col.width,
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row) => (
                            <tr
                                key={keyExtractor(row)}
                                style={{
                                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                                    transition: 'background 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.025)';
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                                }}
                            >
                                {columns.map((col) => (
                                    <td
                                        key={col.key}
                                        style={{
                                            padding: '16px 20px',
                                            textAlign: col.align ?? 'left',
                                            verticalAlign: 'middle',
                                        }}
                                    >
                                        {col.render(row)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </GlassPanel>
    );
}
