'use client';

import { useEffect, useState } from 'react';
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

export default function AdminPage() {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);

    // PIX Modal for Admin
    const [showPixModal, setShowPixModal] = useState(false);
    const [pixData, setPixData] = useState<{ qr_code: string, qr_code_base64: string, ticket_url: string } | null>(null);
    const [activeResId, setActiveResId] = useState<number | null>(null);

    const fetchReservations = () => {
        setLoading(true);
        fetch('/api/reservations')
            .then(res => res.json())
            .then(data => {
                setReservations(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchReservations();
    }, []);

    const togglePaymentStatus = async (id: number, currentStatus: string) => {
        const newStatus = currentStatus === 'Pago' ? 'Pendente' : 'Pago';
        try {
            const res = await fetch(`/api/reservations/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, payment_status: newStatus })
            });
            if (res.ok) {
                setReservations(reservations.map(r => r.id === id ? { ...r, payment_status: newStatus } : r));
            }
        } catch (error) {
            alert('Erro ao atualizar status de pagamento');
        }
    };

    const deleteReservation = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir esta reserva?')) return;

        try {
            const res = await fetch(`/api/reservations/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setReservations(reservations.filter(r => r.id !== id));
            } else {
                alert('Erro ao excluir reserva');
            }
        } catch (error) {
            alert('Erro de conexão');
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
                setReservations(reservations.map(r => r.id === id ? { ...r, pickup_status: newStatus } : r));
            }
        } catch (error) {
            alert('Erro ao atualizar status de retirada');
        }
    };

    const generatePixForAdmin = async (res: Reservation) => {
        try {
            setActiveResId(res.id);
            const checkoutRes = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reservationId: res.id,
                    guests: res.guests,
                    name: res.customer_name
                }),
            });

            const data = await checkoutRes.json();
            if (checkoutRes.ok && data.qr_code) {
                setPixData(data);
                setShowPixModal(true);
            } else {
                alert('Erro ao gerar PIX: ' + (data.error || 'Erro desconhecido'));
            }
        } catch (error) {
            alert('Erro de conexão ao gerar PIX');
        }
    };

    return (
        <main>
            <Header />
            <section style={{ padding: '120px 20px', minHeight: '100vh', background: 'var(--background)' }}>
                <div className="glass-card" style={{ maxWidth: '1250px', margin: '0 auto', padding: '40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                        <h1 className="brand" style={{ fontSize: '2.5rem', margin: 0 }}>Pedidos Recebidos</h1>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Total: {reservations.length}</span>
                            <br />
                            <button onClick={fetchReservations} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}>🔄 Atualizar</button>
                        </div>
                    </div>

                    {loading ? (
                        <p style={{ textAlign: 'center', padding: '40px' }}>Carregando pedidos...</p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
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
                                            <td style={{ padding: '15px', color: 'var(--primary)', fontWeight: 'bold' }}>
                                                #{res.id}
                                            </td>
                                            <td style={{ padding: '15px', fontSize: '0.85rem' }}>
                                                {new Date(res.created_at).toLocaleString('pt-BR')}
                                            </td>
                                            <td style={{ padding: '15px' }}>
                                                <div style={{ fontWeight: 'bold' }}>{res.customer_name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>{res.phone}</div>
                                            </td>
                                            <td style={{ padding: '15px', textAlign: 'center' }}>
                                                <span style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '4px' }}>
                                                    {res.guests}
                                                </span>
                                            </td>
                                            <td style={{ padding: '15px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                    <button
                                                        onClick={() => togglePaymentStatus(res.id, res.payment_status)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            borderRadius: '6px',
                                                            fontSize: '0.7rem',
                                                            background: res.payment_status === 'Pago' ? 'rgba(37, 211, 102, 0.2)' : 'rgba(212, 160, 23, 0.2)',
                                                            color: res.payment_status === 'Pago' ? '#25d366' : 'var(--primary)',
                                                            border: `1px solid ${res.payment_status === 'Pago' ? '#25d366' : 'var(--primary)'}`,
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        {res.payment_status === 'Pago' ? 'PAGO (Clique p/ Pendente)' : 'PENDENTE (Clique p/ Confirmar)'}
                                                    </button>

                                                    {res.payment_status !== 'Pago' && (
                                                        <button
                                                            onClick={() => generatePixForAdmin(res)}
                                                            style={{
                                                                background: 'transparent',
                                                                border: 'none',
                                                                color: 'var(--text-muted)',
                                                                fontSize: '0.65rem',
                                                                textDecoration: 'underline',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            Gerar Novo PIX
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: '15px' }}>
                                                <button
                                                    onClick={() => togglePickupStatus(res.id, res.pickup_status)}
                                                    style={{
                                                        padding: '6px 16px',
                                                        borderRadius: '20px',
                                                        fontSize: '0.75rem',
                                                        background: res.pickup_status === 'Retirado' ? 'rgba(0, 123, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                                        color: res.pickup_status === 'Retirado' ? '#007bff' : 'var(--text-muted)',
                                                        border: `1px solid ${res.pickup_status === 'Retirado' ? '#007bff' : 'var(--glass-border)'}`,
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {res.pickup_status === 'Retirado' ? 'Retirado' : 'A Retirar'}
                                                </button>
                                            </td>
                                            <td style={{ padding: '15px' }}>
                                                <button
                                                    onClick={() => deleteReservation(res.id)}
                                                    style={{
                                                        background: 'rgba(231, 76, 60, 0.1)',
                                                        color: '#e74c3c',
                                                        border: '1px solid #e74c3c',
                                                        padding: '6px 10px',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.75rem'
                                                    }}
                                                >
                                                    Excluir
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {reservations.length === 0 && (
                                        <tr>
                                            <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                Nenhum pedido encontrado.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </section>

            {/* PIX Modal for Admin */}
            {showPixModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0,0,0,0.85)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }}>
                    <div className="glass-card" style={{ maxWidth: '400px', width: '100%', padding: '30px', textAlign: 'center' }}>
                        <h3 style={{ color: 'var(--primary)', marginBottom: '15px' }}>QR Code PIX - Pedido #{activeResId}</h3>

                        {pixData && (
                            <div style={{ background: 'white', padding: '15px', borderRadius: '12px', display: 'inline-block', marginBottom: '20px' }}>
                                <img
                                    src={`data:image/png;base64,${pixData.qr_code_base64}`}
                                    alt="QR Code PIX"
                                    style={{ width: '200px', height: '200px' }}
                                />
                            </div>
                        )}

                        <button
                            onClick={() => {
                                if (pixData) {
                                    navigator.clipboard.writeText(pixData.qr_code);
                                    alert('Chave PIX copiada!');
                                }
                            }}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: 'var(--primary)',
                                color: 'black',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                marginBottom: '10px'
                            }}
                        >
                            Copiar Chave PIX
                        </button>

                        <button
                            onClick={() => setShowPixModal(false)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                            }}
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}
