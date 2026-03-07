'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Header from '@/components/Header';

interface Reservation {
    id: number;
    customer_name: string;
    customer_email: string;
    phone: string;
    reservation_date: string;
    reservation_time: string;
    guests: number;
    payment_status: string;
    pickup_status: string;
    created_at: string;
}

interface Toast {
    id: number;
    type: 'success' | 'error' | 'info';
    text: string;
    exiting?: boolean;
}

export default function AdminPage() {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<Reservation | null>(null);
    const [deleting, setDeleting] = useState(false);

    // PIX Modal for Admin
    const [showPixModal, setShowPixModal] = useState(false);
    const [pixData, setPixData] = useState<{ qr_code: string, qr_code_base64: string, ticket_url: string } | null>(null);
    const [activeResId, setActiveResId] = useState<number | null>(null);

    // ── Toasts ──────────────────────────────────────────
    const showToast = useCallback((type: Toast['type'], text: string) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, text }]);
        setTimeout(() => {
            setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
            setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 350);
        }, 3000);
    }, []);

    // ── Data fetching ────────────────────────────────────
    const fetchReservations = useCallback(() => {
        setLoading(true);
        fetch('/api/reservations')
            .then(res => res.json())
            .then(data => { setReservations(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    useEffect(() => { fetchReservations(); }, [fetchReservations]);

    // ── Filtering ────────────────────────────────────────
    const filteredReservations = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return reservations.filter(r =>
            r.customer_name.toLowerCase().includes(term) ||
            r.phone.includes(term) ||
            r.id.toString() === term ||
            `#${r.id}` === term
        );
    }, [reservations, searchTerm]);

    // ── Actions ──────────────────────────────────────────
    const togglePaymentStatus = async (id: number, currentStatus: string) => {
        const newStatus = currentStatus === 'Pago' ? 'Pendente' : 'Pago';
        try {
            const res = await fetch(`/api/reservations/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, payment_status: newStatus })
            });
            if (res.ok) {
                setReservations(prev => prev.map(r => r.id === id ? { ...r, payment_status: newStatus } : r));
                showToast(newStatus === 'Pago' ? 'success' : 'info', newStatus === 'Pago' ? '✅ Pagamento confirmado!' : '⏳ Marcado como pendente');
            }
        } catch {
            showToast('error', 'Erro ao atualizar pagamento');
        }
    };

    const togglePickupStatus = async (id: number, currentStatus: string) => {
        const newStatus = currentStatus === 'Retirado' ? 'Pendente' : 'Retirado';
        try {
            const res = await fetch(`/api/reservations/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, pickup_status: newStatus })
            });
            if (res.ok) {
                setReservations(prev => prev.map(r => r.id === id ? { ...r, pickup_status: newStatus } : r));
                showToast(newStatus === 'Retirado' ? 'success' : 'info', newStatus === 'Retirado' ? '📦 Retirada confirmada!' : '🔄 Marcado como a retirar');
            }
        } catch {
            showToast('error', 'Erro ao atualizar retirada');
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/reservations/${deleteTarget.id}`, { method: 'DELETE' });
            if (res.ok) {
                setReservations(prev => prev.filter(r => r.id !== deleteTarget.id));
                showToast('error', `🗑️ Reserva #${deleteTarget.id} excluída`);
            } else {
                showToast('error', 'Erro ao excluir reserva');
            }
        } catch {
            showToast('error', 'Erro de conexão');
        } finally {
            setDeleting(false);
            setDeleteTarget(null);
        }
    };

    const generatePixForAdmin = async (res: Reservation) => {
        try {
            setActiveResId(res.id);
            const checkoutRes = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reservationId: res.id, guests: res.guests, name: res.customer_name }),
            });
            const data = await checkoutRes.json();
            if (checkoutRes.ok && data.qr_code) {
                setPixData(data);
                setShowPixModal(true);
                showToast('success', '📲 QR Code gerado!');
            } else {
                showToast('error', 'Erro ao gerar PIX: ' + (data.error || 'Tente novamente'));
            }
        } catch {
            showToast('error', 'Erro de conexão ao gerar PIX');
        }
    };

    // ── Shared button styles ─────────────────────────────
    const payBtnStyle = (paid: boolean): React.CSSProperties => ({
        padding: '10px 8px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 600,
        background: paid ? 'rgba(37,211,102,0.15)' : 'rgba(212,160,23,0.15)',
        color: paid ? '#25d366' : 'var(--primary)',
        border: `1px solid ${paid ? '#25d366' : 'var(--primary)'}`, cursor: 'pointer',
    });

    const pickupBtnStyle = (done: boolean): React.CSSProperties => ({
        padding: '10px 8px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 600,
        background: done ? 'rgba(0,123,255,0.15)' : 'rgba(255,255,255,0.05)',
        color: done ? '#007bff' : 'var(--text-muted)',
        border: `1px solid ${done ? '#007bff' : 'var(--glass-border)'}`, cursor: 'pointer',
    });

    const deleteBtnStyle: React.CSSProperties = {
        padding: '10px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 600,
        background: 'rgba(231,76,60,0.1)', color: '#e74c3c',
        border: '1px solid rgba(231,76,60,0.5)', cursor: 'pointer',
    };

    return (
        <main>
            <Header />
            <section style={{ padding: '100px 12px 60px', minHeight: '100vh', background: 'var(--background)' }}>
                <div className="glass-card animate-fade" style={{ maxWidth: '1250px', margin: '0 auto', padding: '24px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
                        <div>
                            <h1 className="brand animate-glow" style={{ fontSize: '2rem', margin: 0, color: 'var(--primary)' }}>Pedidos Recebidos</h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>Gerenciamento de reservas e pagamentos</p>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    placeholder="Buscar por nome, celular ou ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        padding: '12px 16px 12px 40px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '12px',
                                        color: 'white',
                                        fontSize: '0.9rem',
                                        width: '280px'
                                    }}
                                />
                                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
                            </div>
                            <div style={{ textAlign: 'right', minWidth: '100px' }}>
                                <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.1rem' }}>Total: {reservations.length}</span>
                                <br />
                                <button onClick={fetchReservations} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', padding: '4px' }}>🔄 Atualizar</button>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '80px 0' }}>
                            <div style={{ width: '40px', height: '40px', border: '4px solid var(--glass-border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
                            <p style={{ color: 'var(--text-muted)' }}>Carregando pedidos...</p>
                        </div>
                    ) : filteredReservations.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '80px 0', background: 'rgba(255,255,255,0.02)', borderRadius: '20px' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.3 }}>🥣</div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                                {searchTerm ? 'Nenhum pedido condiz com a busca.' : 'Ainda não recebemos nenhum pedido.'}
                            </p>
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', marginTop: '10px', textDecoration: 'underline' }}>Limpar busca</button>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* ── DESKTOP TABLE ── */}
                            <div className="admin-table-desktop" style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', textAlign: 'left', minWidth: '900px' }}>
                                    <thead>
                                        <tr style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            <th style={{ padding: '12px 20px' }}>ID</th>
                                            <th style={{ padding: '12px 20px' }}>Cliente</th>
                                            <th style={{ padding: '12px 20px', textAlign: 'center' }}>Marmitas</th>
                                            <th style={{ padding: '12px 20px' }}>Pagamento</th>
                                            <th style={{ padding: '12px 20px' }}>Retirada</th>
                                            <th style={{ padding: '12px 20px' }}>Data/Hora</th>
                                            <th style={{ padding: '12px 20px', textAlign: 'right' }}>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredReservations.map((res) => (
                                            <tr key={res.id} style={{ background: 'rgba(255,255,255,0.03)', transition: 'transform 0.2s', border: '1px solid var(--glass-border)' }}>
                                                <td style={{ padding: '18px 20px', color: 'var(--primary)', fontWeight: 'bold', borderRadius: '12px 0 0 12px' }}>#{res.id}</td>
                                                <td style={{ padding: '18px 20px' }}>
                                                    <div style={{ fontWeight: '600', fontSize: '1rem' }}>{res.customer_name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{res.phone}</div>
                                                </td>
                                                <td style={{ padding: '18px 20px', textAlign: 'center' }}>
                                                    <span style={{ background: 'rgba(212, 160, 23, 0.1)', color: 'var(--primary)', padding: '6px 14px', borderRadius: '8px', fontWeight: 'bold' }}>{res.guests}</span>
                                                </td>
                                                <td style={{ padding: '18px 20px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <button
                                                            onClick={() => togglePaymentStatus(res.id, res.payment_status)}
                                                            className="stagger"
                                                            style={{
                                                                padding: '8px 14px',
                                                                borderRadius: '8px',
                                                                fontSize: '0.75rem',
                                                                background: res.payment_status === 'Pago' ? 'rgba(37,211,102,0.1)' : 'rgba(212,160,23,0.1)',
                                                                color: res.payment_status === 'Pago' ? '#2ecc71' : 'var(--primary)',
                                                                border: `1px solid ${res.payment_status === 'Pago' ? 'rgba(37,211,102,0.3)' : 'rgba(212,160,23,0.3)'}`,
                                                                fontWeight: 700
                                                            }}
                                                        >
                                                            {res.payment_status === 'Pago' ? 'PAGO ✓' : 'PENDENTE'}
                                                        </button>
                                                        {res.payment_status !== 'Pago' && (
                                                            <button onClick={() => generatePixForAdmin(res)} title="Gerar QR Code PIX" style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-muted)', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>📲</button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '18px 20px' }}>
                                                    <button
                                                        onClick={() => togglePickupStatus(res.id, res.pickup_status)}
                                                        style={{
                                                            padding: '8px 16px',
                                                            borderRadius: '20px',
                                                            fontSize: '0.75rem',
                                                            background: res.pickup_status === 'Retirado' ? 'rgba(0,123,255,0.1)' : 'rgba(255,255,255,0.05)',
                                                            color: res.pickup_status === 'Retirado' ? '#3498db' : 'var(--text-muted)',
                                                            border: `1px solid ${res.pickup_status === 'Retirado' ? 'rgba(0,123,255,0.3)' : 'var(--glass-border)'}`,
                                                            fontWeight: 600
                                                        }}
                                                    >
                                                        {res.pickup_status === 'Retirado' ? 'Retirado' : 'A Retirar'}
                                                    </button>
                                                </td>
                                                <td style={{ padding: '18px 20px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                    {new Date(res.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td style={{ padding: '18px 20px', textAlign: 'right', borderRadius: '0 12px 12px 0' }}>
                                                    <button onClick={() => setDeleteTarget(res)} style={{ background: 'rgba(231,76,60,0.1)', color: '#e74c3c', border: '1px solid rgba(231,76,60,0.2)', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem' }}>🗑️</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* ── MOBILE CARDS ── */}
                            <div className="admin-cards-mobile" style={{ flexDirection: 'column', gap: '14px' }}>
                                {filteredReservations.map((res, i) => (
                                    <div key={res.id} className="res-card" style={{ animationDelay: `${i * 0.05}s`, background: 'rgba(255,255,255,0.03)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.1rem' }}>#{res.id}</span>
                                                <h3 style={{ fontSize: '1rem', marginTop: '4px' }}>{res.customer_name}</h3>
                                            </div>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--primary)', background: 'rgba(212, 160, 23, 0.1)', padding: '4px 12px', borderRadius: '8px', fontWeight: 'bold' }}>{res.guests} marmitas</span>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)', margin: '8px 0' }}>
                                            <span>📞 {res.phone}</span>
                                            <span>📅 {new Date(res.created_at).toLocaleString('pt-BR')}</span>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
                                            <button onClick={() => togglePaymentStatus(res.id, res.payment_status)} style={payBtnStyle(res.payment_status === 'Pago')}>
                                                {res.payment_status === 'Pago' ? '✅ Pago' : '⏳ Pendente'}
                                            </button>
                                            <button onClick={() => togglePickupStatus(res.id, res.pickup_status)} style={pickupBtnStyle(res.pickup_status === 'Retirado')}>
                                                {res.pickup_status === 'Retirado' ? '📦 Retirado' : '🔄 A Retirar'}
                                            </button>
                                            <button onClick={() => generatePixForAdmin(res)} style={{ padding: '12px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600, background: 'rgba(212,160,23,0.1)', color: 'var(--primary)', border: '1px solid var(--primary)', cursor: 'pointer', gridColumn: 'span 1' }}>
                                                📲 PIX
                                            </button>
                                            <button onClick={() => setDeleteTarget(res)} style={{ ...deleteBtnStyle, padding: '12px', borderRadius: '12px' }}>
                                                🗑️ Excluir
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* ── CUSTOM DELETE MODAL ── */}
            {deleteTarget && (
                <div className="delete-modal-backdrop" onClick={() => !deleting && setDeleteTarget(null)}>
                    <div className="delete-modal" onClick={e => e.stopPropagation()}>
                        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🗑️</div>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '12px', color: 'var(--text)' }}>Excluir reserva?</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '32px', lineHeight: 1.6 }}>
                            Você está prestes a excluir permanentemente o pedido de<br />
                            <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>#{deleteTarget.id} — {deleteTarget.customer_name}</strong>
                        </p>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <button
                                onClick={() => setDeleteTarget(null)}
                                disabled={deleting}
                                style={{ flex: 1, padding: '16px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--glass-border)', cursor: 'pointer', fontSize: '1rem', fontWeight: 600 }}
                            >
                                Voltar
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={deleting}
                                style={{ flex: 1, padding: '16px', borderRadius: '14px', background: deleting ? 'rgba(231,76,60,0.3)' : 'rgba(231,76,60,0.9)', color: 'white', border: 'none', cursor: deleting ? 'not-allowed' : 'pointer', fontSize: '1rem', fontWeight: 700 }}
                            >
                                {deleting ? '...' : 'Excluir'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── PIX MODAL ── */}
            {showPixModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div className="glass-card animate-bounce" style={{ maxWidth: '420px', width: '100%', padding: '40px 30px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}>
                        <h3 style={{ color: 'var(--primary)', marginBottom: '20px', fontSize: '1.6rem', fontFamily: 'Playfair Display' }}>QR Code PIX</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.9rem' }}>Pedido #{activeResId} — {reservations.find(r => r.id === activeResId)?.customer_name}</p>

                        {pixData && (
                            <div style={{ background: 'white', padding: '20px', borderRadius: '24px', display: 'inline-block', marginBottom: '30px', boxShadow: '0 0 30px rgba(212, 160, 23, 0.2)' }}>
                                <img src={`data:image/png;base64,${pixData.qr_code_base64}`} alt="QR Code PIX" style={{ width: '220px', height: '220px' }} />
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button
                                onClick={() => { if (pixData) { navigator.clipboard.writeText(pixData.qr_code); showToast('success', 'Chave copiada! 📋'); } }}
                                className="btn-primary"
                                style={{ width: '100%', padding: '16px', borderRadius: '14px', fontSize: '1rem' }}
                            >
                                Copiar Chave PIX
                            </button>
                            <button
                                onClick={() => setShowPixModal(false)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem', marginTop: '10px', textDecoration: 'underline' }}
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── TOASTS ── */}
            <div className="toast-container">
                {toasts.map(t => (
                    <div key={t.id} className={`toast toast-${t.type}${t.exiting ? ' exit' : ''}`}>
                        {t.text}
                    </div>
                ))}
            </div>
        </main>
    );
}
