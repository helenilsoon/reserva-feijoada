'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Header from '@/components/Header';
import { Search, Trash2, QrCode, Edit, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReservationForm from '@/components/ReservationForm';

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

    // Edit Modal for Admin
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);

    const MARMITA_PRICE = 35.00;

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

    const totalRevenue = reservations
        .filter(r => r.payment_status === 'Pago')
        .reduce((acc, r) => acc + (r.guests * MARMITA_PRICE), 0);

    const pendingRevenue = reservations
        .filter(r => r.payment_status === 'Pendente')
        .reduce((acc, r) => acc + (r.guests * MARMITA_PRICE), 0);

    // ── Actions ──────────────────────────────────────────
    const toggleStatus = async (id: number, field: 'payment_status' | 'pickup_status', newStatus: string) => {
        try {
            const res = await fetch(`/api/reservations/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, [field]: newStatus })
            });
            if (res.ok) {
                setReservations(prev => prev.map(r => r.id === id ? { ...r, [field]: newStatus } : r));
                showToast('success', '✅ Status atualizado!');
            }
        } catch {
            showToast('error', 'Erro ao atualizar status');
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

                    {/* Estatísticas */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>Total de Pedidos</p>
                            <h2 style={{ fontSize: '1.8rem', color: 'var(--primary)', margin: 0 }}>{reservations.length}</h2>
                            <p style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '4px' }}>{reservations.reduce((acc, r) => acc + r.guests, 0)} marmitas</p>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>Arrecadação (Paga)</p>
                            <h2 style={{ fontSize: '1.8rem', color: '#25d366', margin: 0 }}>R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>A Receber (Pendente)</p>
                            <h2 style={{ fontSize: '1.8rem', color: 'var(--primary)', opacity: 0.8, margin: 0 }}>R$ {pendingRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
                        </div>
                    </div>

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
                            <button onClick={fetchReservations} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)', cursor: 'pointer', borderRadius: '12px', padding: '10px 15px' }}>🔄 Atualizar</button>
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
                            <div className="table-container" style={{ overflowX: 'auto', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                                            <th style={{ padding: '18px 20px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem' }}>ID</th>
                                            <th style={{ padding: '18px 20px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem' }}>CLIENTE</th>
                                            <th style={{ padding: '18px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>QUANTIDADE</th>
                                            <th style={{ padding: '18px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>TOTAL</th>
                                            <th style={{ padding: '18px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>PAGAMENTO</th>
                                            <th style={{ padding: '18px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>RETIRADA</th>
                                            <th style={{ padding: '18px 20px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.85rem' }}>AÇÕES</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredReservations.map(res => (
                                            <tr key={res.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                                                <td style={{ padding: '18px 20px', fontSize: '0.9rem', opacity: 0.6 }}>#{res.id}</td>
                                                <td style={{ padding: '18px 20px' }}>
                                                    <div style={{ fontWeight: '600' }}>{res.customer_name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{res.phone}</div>
                                                </td>
                                                <td style={{ padding: '18px 20px', textAlign: 'center' }}>
                                                    <span style={{ background: 'rgba(212, 160, 23, 0.1)', color: 'var(--primary)', padding: '6px 14px', borderRadius: '8px', fontWeight: 'bold' }}>{res.guests} marmitas</span>
                                                </td>
                                                <td style={{ padding: '18px 20px', textAlign: 'center', fontWeight: '700', color: 'white' }}>
                                                    R$ {(res.guests * MARMITA_PRICE).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td style={{ padding: '18px 20px', textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => toggleStatus(res.id, 'payment_status', res.payment_status === 'Pago' ? 'Pendente' : 'Pago')}
                                                        style={payBtnStyle(res.payment_status === 'Pago')}
                                                    >
                                                        {res.payment_status}
                                                    </button>
                                                </td>
                                                <td style={{ padding: '18px 20px', textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => toggleStatus(res.id, 'pickup_status', res.pickup_status === 'Retirado' ? 'Pendente' : 'Retirado')}
                                                        style={pickupBtnStyle(res.pickup_status === 'Retirado')}
                                                    >
                                                        {res.pickup_status}
                                                    </button>
                                                </td>
                                                <td style={{ padding: '18px 20px', textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                        <button
                                                            onClick={() => {
                                                                setEditingReservation(res);
                                                                setIsEditModalOpen(true);
                                                            }}
                                                            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '10px', borderRadius: '10px', cursor: 'pointer' }}
                                                            title="Editar"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => generatePixForAdmin(res)}
                                                            style={{ background: 'rgba(37,211,102,0.1)', border: 'none', color: '#2ecc71', padding: '10px', borderRadius: '10px', cursor: 'pointer' }}
                                                            title="PIX"
                                                        >
                                                            <QrCode size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteTarget(res)}
                                                            style={deleteBtnStyle}
                                                            title="Excluir"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* ── MOBILE CARDS ── */}
                            <div className="admin-cards-mobile" style={{ flexDirection: 'column', gap: '14px', marginTop: '20px' }}>
                                {filteredReservations.map((res, i) => (
                                    <div key={res.id} className="res-card" style={{ animationDelay: `${i * 0.05}s`, background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.1rem' }}>#{res.id}</span>
                                                <h3 style={{ fontSize: '1rem', marginTop: '4px' }}>{res.customer_name}</h3>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--primary)', background: 'rgba(212, 160, 23, 0.1)', padding: '4px 12px', borderRadius: '8px', fontWeight: 'bold' }}>{res.guests} unid.</span>
                                                <div style={{ fontSize: '0.9rem', fontWeight: '700', marginTop: '6px' }}>R$ {(res.guests * MARMITA_PRICE).toFixed(2)}</div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)', margin: '14px 0' }}>
                                            <span>📞 {res.phone}</span>
                                            <span>📅 {new Date(res.created_at).toLocaleString('pt-BR')}</span>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
                                            <button onClick={() => toggleStatus(res.id, 'payment_status', res.payment_status === 'Pago' ? 'Pendente' : 'Pago')} style={payBtnStyle(res.payment_status === 'Pago')}>
                                                {res.payment_status === 'Pago' ? '✅ Pago' : '⏳ Pendente'}
                                            </button>
                                            <button onClick={() => toggleStatus(res.id, 'pickup_status', res.pickup_status === 'Retirado' ? 'Pendente' : 'Retirado')} style={pickupBtnStyle(res.pickup_status === 'Retirado')}>
                                                {res.pickup_status === 'Retirado' ? '📦 Retirado' : '🔄 A Retirar'}
                                            </button>
                                            <button
                                                onClick={() => { setEditingReservation(res); setIsEditModalOpen(true); }}
                                                style={{ padding: '12px', borderRadius: '12px', fontSize: '0.85rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--glass-border)', cursor: 'pointer' }}
                                            >
                                                📝 Editar
                                            </button>
                                            <button onClick={() => generatePixForAdmin(res)} style={{ padding: '12px', borderRadius: '12px', fontSize: '0.85rem', background: 'rgba(212,160,23,0.1)', color: 'var(--primary)', border: '1px solid var(--primary)', cursor: 'pointer' }}>
                                                📲 PIX
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* ── MODAL EDITAR ── */}
            <AnimatePresence>
                {isEditModalOpen && editingReservation && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} style={{ width: '100%', maxWidth: '500px', background: 'var(--card-bg)', borderRadius: '24px', border: '1px solid var(--glass-border)', padding: '30px', position: 'relative' }}>
                            <button onClick={() => setIsEditModalOpen(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                            <h2 style={{ marginBottom: '20px', fontSize: '1.5rem' }}>Editar Reserva #{editingReservation.id}</h2>
                            <ReservationForm
                                reservation={editingReservation}
                                onSuccess={() => { setIsEditModalOpen(false); fetchReservations(); }}
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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
                <AnimatePresence>
                    {toasts.map(t => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className={`toast toast-${t.type}${t.exiting ? ' exit' : ''}`}
                        >
                            {t.text}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </main>
    );
}
