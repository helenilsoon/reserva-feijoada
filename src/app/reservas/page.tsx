'use client';

import { useEffect, useState, useCallback } from 'react';
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
    const fetchReservations = () => {
        setLoading(true);
        fetch('/api/reservations')
            .then(res => res.json())
            .then(data => { setReservations(data); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => { fetchReservations(); }, []);

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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                        <h1 className="brand animate-glow" style={{ fontSize: '1.8rem', margin: 0 }}>Pedidos Recebidos</h1>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Total: {reservations.length}</span>
                            <br />
                            <button onClick={fetchReservations} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}>🔄 Atualizar</button>
                        </div>
                    </div>

                    {loading ? (
                        <p style={{ textAlign: 'center', padding: '40px' }}>Carregando pedidos...</p>
                    ) : reservations.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Nenhum pedido encontrado.</p>
                    ) : (
                        <>
                            {/* ── DESKTOP TABLE ── */}
                            <div className="admin-table-desktop" style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '720px' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid var(--glass-border)', color: 'var(--primary)' }}>
                                            <th style={{ padding: '15px' }}>ID</th>
                                            <th style={{ padding: '15px' }}>Data/Hora</th>
                                            <th style={{ padding: '15px' }}>Cliente</th>
                                            <th style={{ padding: '15px' }}>Marmitas</th>
                                            <th style={{ padding: '15px' }}>Status Pagam.</th>
                                            <th style={{ padding: '15px' }}>Retirada</th>
                                            <th style={{ padding: '15px' }}>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reservations.map((res) => (
                                            <tr key={res.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.3s' }}>
                                                <td style={{ padding: '15px', color: 'var(--primary)', fontWeight: 'bold' }}>#{res.id}</td>
                                                <td style={{ padding: '15px', fontSize: '0.85rem' }}>{new Date(res.created_at).toLocaleString('pt-BR')}</td>
                                                <td style={{ padding: '15px' }}>
                                                    <div style={{ fontWeight: 'bold' }}>{res.customer_name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>{res.phone}</div>
                                                </td>
                                                <td style={{ padding: '15px', textAlign: 'center' }}>
                                                    <span style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '4px' }}>{res.guests}</span>
                                                </td>
                                                <td style={{ padding: '15px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                        <button onClick={() => togglePaymentStatus(res.id, res.payment_status)} style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '0.7rem', background: res.payment_status === 'Pago' ? 'rgba(37,211,102,0.2)' : 'rgba(212,160,23,0.2)', color: res.payment_status === 'Pago' ? '#25d366' : 'var(--primary)', border: `1px solid ${res.payment_status === 'Pago' ? '#25d366' : 'var(--primary)'}`, cursor: 'pointer' }}>
                                                            {res.payment_status === 'Pago' ? 'PAGO ✓' : 'PENDENTE'}
                                                        </button>
                                                        {res.payment_status !== 'Pago' && (
                                                            <button onClick={() => generatePixForAdmin(res)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.65rem', textDecoration: 'underline', cursor: 'pointer' }}>Gerar PIX</button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '15px' }}>
                                                    <button onClick={() => togglePickupStatus(res.id, res.pickup_status)} style={{ padding: '6px 16px', borderRadius: '20px', fontSize: '0.75rem', background: res.pickup_status === 'Retirado' ? 'rgba(0,123,255,0.2)' : 'rgba(255,255,255,0.05)', color: res.pickup_status === 'Retirado' ? '#007bff' : 'var(--text-muted)', border: `1px solid ${res.pickup_status === 'Retirado' ? '#007bff' : 'var(--glass-border)'}`, cursor: 'pointer' }}>
                                                        {res.pickup_status === 'Retirado' ? 'Retirado' : 'A Retirar'}
                                                    </button>
                                                </td>
                                                <td style={{ padding: '15px' }}>
                                                    <button onClick={() => setDeleteTarget(res)} style={{ background: 'rgba(231,76,60,0.1)', color: '#e74c3c', border: '1px solid #e74c3c', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}>🗑️ Excluir</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* ── MOBILE CARDS ── */}
                            <div className="admin-cards-mobile" style={{ flexDirection: 'column', gap: '14px' }}>
                                {reservations.map((res, i) => (
                                    <div key={res.id} className="res-card" style={{ animationDelay: `${i * 0.07}s` }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1rem' }}>#{res.id} — {res.customer_name}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '20px' }}>🍽️ {res.guests}</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            <span>📞 {res.phone}</span>
                                            <span>🕐 {new Date(res.created_at).toLocaleString('pt-BR')}</span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                            <button onClick={() => togglePaymentStatus(res.id, res.payment_status)} style={payBtnStyle(res.payment_status === 'Pago')}>
                                                {res.payment_status === 'Pago' ? '✅ Pago' : '⏳ Pendente'}
                                            </button>
                                            <button onClick={() => togglePickupStatus(res.id, res.pickup_status)} style={pickupBtnStyle(res.pickup_status === 'Retirado')}>
                                                {res.pickup_status === 'Retirado' ? '📦 Retirado' : '🔄 A Retirar'}
                                            </button>
                                            {res.payment_status !== 'Pago' && (
                                                <button onClick={() => generatePixForAdmin(res)} style={{ padding: '10px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 600, background: 'rgba(212,160,23,0.1)', color: 'var(--primary)', border: '1px solid var(--primary)', cursor: 'pointer' }}>
                                                    📲 Gerar PIX
                                                </button>
                                            )}
                                            <button onClick={() => setDeleteTarget(res)} style={{ ...deleteBtnStyle, gridColumn: res.payment_status !== 'Pago' ? 'auto' : 'span 2' }}>
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
                        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🗑️</div>
                        <h3 style={{ fontSize: '1.3rem', marginBottom: '8px', color: 'var(--text)' }}>Excluir reserva?</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.5 }}>
                            Tem certeza que quer excluir o pedido de<br />
                            <strong style={{ color: 'var(--primary)' }}>#{deleteTarget.id} — {deleteTarget.customer_name}</strong>?<br />
                            <span style={{ fontSize: '0.8rem' }}>Esta ação não pode ser desfeita.</span>
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setDeleteTarget(null)}
                                disabled={deleting}
                                style={{ flex: 1, padding: '13px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--glass-border)', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600 }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={deleting}
                                style={{ flex: 1, padding: '13px', borderRadius: '12px', background: deleting ? 'rgba(231,76,60,0.3)' : 'rgba(231,76,60,0.9)', color: 'white', border: 'none', cursor: deleting ? 'not-allowed' : 'pointer', fontSize: '0.95rem', fontWeight: 700 }}
                            >
                                {deleting ? 'Excluindo...' : 'Sim, excluir'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── PIX MODAL ── */}
            {showPixModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div className="glass-card animate-bounce" style={{ maxWidth: '400px', width: '100%', padding: '30px', textAlign: 'center' }}>
                        <h3 style={{ color: 'var(--primary)', marginBottom: '15px' }}>QR Code PIX — Pedido #{activeResId}</h3>
                        {pixData && (
                            <div style={{ background: 'white', padding: '15px', borderRadius: '12px', display: 'inline-block', marginBottom: '20px' }}>
                                <img src={`data:image/png;base64,${pixData.qr_code_base64}`} alt="QR Code PIX" style={{ width: '200px', height: '200px' }} />
                            </div>
                        )}
                        <button onClick={() => { if (pixData) { navigator.clipboard.writeText(pixData.qr_code); showToast('success', 'Chave PIX copiada! 📋'); } }} style={{ width: '100%', padding: '12px', background: 'var(--primary)', color: '#1a1410', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}>
                            Copiar Chave PIX
                        </button>
                        <button onClick={() => setShowPixModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem' }}>Fechar</button>
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
