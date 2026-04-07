'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Search, Trash2, QrCode, Edit, RefreshCw, BarChart3, TrendingUp, HandCoins, Truck, Store } from 'lucide-react';
import { toast } from 'sonner';
import ReservationForm from '@/components/ReservationForm';
import { formatCurrency, formatPhone } from '@/lib/formatters';
import AdminPageLayout from '@/components/admin/AdminPageLayout';
import StatCard from '@/components/admin/StatCard';
import AdminButton from '@/components/admin/AdminButton';
import AdminInput from '@/components/admin/AdminInput';
import StatusBadge from '@/components/admin/StatusBadge';
import AdminModal from '@/components/admin/AdminModal';
import GlassPanel from '@/components/admin/GlassPanel';
import AdminDataTable, { ColumnDef } from '@/components/admin/AdminDataTable';
import AdminEmptyState from '@/components/admin/AdminEmptyState';
import AdminLoadingState from '@/components/admin/AdminLoadingState';
import Pagination from '@/components/admin/Pagination';

// ─── Types ─────────────────────────────────────────────────────────────────────

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
    delivery_type: 'retirada' | 'entrega';
    address?: string;
    created_at: string;
}

interface PaginatedResult {
    data: Reservation[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

interface EventSettings {
    title: string;
    price: number;
    delivery_enabled: boolean;
    delivery_fee: number;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;
const MARMITA_PRICE = 20.00;

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function AdminPage() {
    const [result, setResult] = useState<PaginatedResult>({
        data: [], total: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 0,
    });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [settings, setSettings] = useState<EventSettings | null>(null);

    // Modals
    const [deleteTarget, setDeleteTarget] = useState<Reservation | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [showPixModal, setShowPixModal] = useState(false);
    const [pixData, setPixData] = useState<{ qr_code: string; qr_code_base64: string; ticket_url: string } | null>(null);
    const [activeResId, setActiveResId] = useState<number | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);

    // ─── Data Fetching ──────────────────────────────────────────────────────────

    const fetchReservations = useCallback((page = 1, search = '') => {
        setLoading(true);
        const params = new URLSearchParams({
            page: page.toString(),
            limit: PAGE_SIZE.toString(),
            ...(search ? { search } : {}),
        });

        fetch(`/api/reservations?${params}`)
            .then(res => res.json())
            .then((data: PaginatedResult) => {
                setResult(data);
                setCurrentPage(page);
            })
            .catch(() => toast.error('Erro ao carregar pedidos.'))
            .finally(() => setLoading(false));
    }, []);

    const fetchSettings = useCallback(() => {
        fetch('/api/admin/settings')
            .then(res => res.json())
            .then(data => setSettings(data))
            .catch(err => console.error('Settings fetch error:', err));
    }, []);

    useEffect(() => {
        fetchReservations(1, '');
        fetchSettings();
    }, [fetchReservations, fetchSettings]);

    // Debounce search — só dispara após parar de digitar
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchReservations(1, searchTerm);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchTerm, fetchReservations]);

    // ─── Helpers ────────────────────────────────────────────────────────────────

    const getTotal = (res: Reservation) => {
        const unitPrice = settings?.price ?? MARMITA_PRICE;
        const subtotal = res.guests * unitPrice;
        const fee = res.delivery_type === 'entrega' ? (settings?.delivery_fee ?? 0) : 0;
        return subtotal + fee;
    };

    // Stats calculated from current page data (all-time requires separate query — use totals from API if needed)
    const { data: reservations } = result;
    const totalRevenue = reservations
        .filter(r => r.payment_status === 'Pago')
        .reduce((acc, r) => acc + getTotal(r), 0);

    const pendingRevenue = reservations
        .filter(r => r.payment_status === 'Pendente')
        .reduce((acc, r) => acc + getTotal(r), 0);

    // ─── Actions ────────────────────────────────────────────────────────────────

    const toggleStatus = async (id: number, field: 'payment_status' | 'pickup_status', newStatus: string) => {
        try {
            const res = await fetch(`/api/reservations/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: newStatus }),
            });
            if (res.ok) {
                setResult(prev => ({
                    ...prev,
                    data: prev.data.map(r => r.id === id ? { ...r, [field]: newStatus } : r),
                }));
                toast.success('Status atualizado!');
            } else {
                const data = await res.json();
                toast.error(data.error || 'Erro ao atualizar status');
            }
        } catch {
            toast.error('Erro de conexão');
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/reservations/${deleteTarget.id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success(`Reserva #${deleteTarget.id} excluída`);
                fetchReservations(currentPage, searchTerm);
            } else {
                toast.error('Erro ao excluir reserva');
            }
        } catch {
            toast.error('Erro de conexão');
        } finally {
            setDeleting(false);
            setDeleteTarget(null);
        }
    };

    const generatePix = async (res: Reservation) => {
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
                toast.success('QR Code gerado!');
            } else {
                toast.error(data.error || 'Erro ao gerar PIX');
            }
        } catch {
            toast.error('Erro de conexão ao gerar PIX');
        }
    };

    // ─── Table Columns Definition ────────────────────────────────────────────────

    const columns: ColumnDef<Reservation>[] = [
        {
            key: 'id',
            header: 'ID',
            width: '70px',
            render: (row) => (
                <span style={{ opacity: 0.55, fontSize: '0.88rem' }}>#{row.id}</span>
            ),
        },
        {
            key: 'cliente',
            header: 'Cliente',
            render: (row) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{row.customer_name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatPhone(row.phone)}</div>
                </div>
            ),
        },
        {
            key: 'logistica',
            header: 'Logística',
            align: 'center',
            render: (row) => (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <StatusBadge variant={row.delivery_type === 'entrega' ? 'info' : 'neutral'}>
                        {row.delivery_type === 'entrega' ? <Truck size={12} /> : <Store size={12} />}
                        {row.delivery_type === 'entrega' ? 'Entrega' : 'Retirada'}
                    </StatusBadge>
                    <AdminButton
                        variant={row.pickup_status === 'Retirado' ? 'info' : 'secondary'}
                        style={{ padding: '5px 10px', fontSize: '0.73rem' }}
                        onClick={() => toggleStatus(row.id, 'pickup_status', row.pickup_status === 'Retirado' ? 'Pendente' : 'Retirado')}
                    >
                        {row.pickup_status === 'Retirado' ? '✅ Finalizado' : '⏳ Pendente'}
                    </AdminButton>
                </div>
            ),
        },
        {
            key: 'qnt',
            header: 'Qnt.',
            align: 'center',
            width: '80px',
            render: (row) => (
                <strong>{row.guests}</strong>
            ),
        },
        {
            key: 'total',
            header: 'Total',
            align: 'center',
            width: '110px',
            render: (row) => (
                <strong style={{ color: 'white' }}>{formatCurrency(getTotal(row))}</strong>
            ),
        },
        {
            key: 'status',
            header: 'Pagamento',
            align: 'center',
            width: '130px',
            render: (row) => (
                <AdminButton
                    variant={row.payment_status === 'Pago' ? 'success' : 'warning'}
                    style={{ padding: '6px 12px', fontSize: '0.8rem', minWidth: '90px' }}
                    onClick={() => toggleStatus(row.id, 'payment_status', row.payment_status === 'Pago' ? 'Pendente' : 'Pago')}
                >
                    {row.payment_status}
                </AdminButton>
            ),
        },
        {
            key: 'acoes',
            header: 'Ações',
            align: 'right',
            width: '120px',
            render: (row) => (
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    <AdminButton
                        variant="ghost"
                        onClick={() => { setEditingReservation(row); setIsEditModalOpen(true); }}
                        style={{ padding: '8px' }}
                        title="Editar"
                    >
                        <Edit size={15} />
                    </AdminButton>
                    <AdminButton
                        variant="success"
                        onClick={() => generatePix(row)}
                        style={{ padding: '8px', background: 'rgba(37,211,102,0.1)' }}
                        title="Gerar PIX"
                    >
                        <QrCode size={15} />
                    </AdminButton>
                    <AdminButton
                        variant="danger"
                        onClick={() => setDeleteTarget(row)}
                        style={{ padding: '8px' }}
                        title="Excluir"
                    >
                        <Trash2 size={15} />
                    </AdminButton>
                </div>
            ),
        },
    ];

    // ─── Toolbar ─────────────────────────────────────────────────────────────────

    const toolbar = (
        <>
            <AdminInput
                placeholder="Buscar nome, celular..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={Search}
                fullWidth={false}
                containerStyle={{ minWidth: '240px' }}
            />
            <AdminButton
                variant="secondary"
                onClick={() => fetchReservations(currentPage, searchTerm)}
                icon={RefreshCw}
                loading={loading}
            >
                <span className="desktop-only text-sm">Atualizar</span>
            </AdminButton>
        </>
    );

    // ─── Render ──────────────────────────────────────────────────────────────────

    return (
        <AdminPageLayout
            title="Gestão de Pedidos"
            subtitle={result.total > 0 ? `${result.total} pedidos registrados` : undefined}
            actions={toolbar}
            backPath="/admin"
        >
            {/* Estatísticas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                <StatCard
                    label="Total de Pedidos"
                    value={result.total}
                    icon={BarChart3}
                    subtext={`${reservations.reduce((acc, r) => acc + r.guests, 0)} marmitas (página atual)`}
                />
                <StatCard
                    label="Arrecadação (Pago)"
                    value={formatCurrency(totalRevenue)}
                    icon={TrendingUp}
                    color="#25d366"
                />
                <StatCard
                    label="Pendente"
                    value={formatCurrency(pendingRevenue)}
                    icon={HandCoins}
                    color="rgba(212,160,23,0.6)"
                />
                <StatCard
                    label="Venda Rápida"
                    value="Cobrança"
                    icon={QrCode}
                    onClick={() => window.location.href = '/admin/maquininha'}
                    className="premium-border"
                    subtext="Maquininha física"
                />
            </div>

            {/* Table / Cards / States */}
            {loading ? (
                <AdminLoadingState message="Carregando pedidos..." />
            ) : reservations.length === 0 ? (
                <AdminEmptyState
                    icon="🥣"
                    message={searchTerm ? 'Nenhum pedido condiz com a busca.' : 'Ainda não recebemos nenhum pedido.'}
                    onClear={searchTerm ? () => setSearchTerm('') : undefined}
                />
            ) : (
                <>
                    {/* ── Desktop Table ── */}
                    <div className="admin-table-desktop">
                        <AdminDataTable
                            columns={columns}
                            data={reservations}
                            keyExtractor={(r) => r.id}
                        />
                    </div>

                    {/* ── Mobile Cards ── */}
                    <div className="admin-cards-mobile" style={{ flexDirection: 'column', gap: '14px' }}>
                        {reservations.map((res) => (
                            <GlassPanel key={res.id} style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                                    <div>
                                        <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.05rem' }}>#{res.id}</span>
                                        <h3 style={{ fontSize: '1rem', marginTop: '4px' }}>{res.customer_name}</h3>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{formatPhone(res.phone)}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <StatusBadge variant={res.delivery_type === 'entrega' ? 'info' : 'neutral'}>
                                            {res.delivery_type === 'entrega' ? 'Entrega' : 'Retirada'}
                                        </StatusBadge>
                                        <div style={{ fontSize: '1rem', fontWeight: '700', marginTop: '8px' }}>{formatCurrency(getTotal(res))}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{res.guests} unid.</div>
                                    </div>
                                </div>

                                {res.delivery_type === 'entrega' && res.address && (
                                    <div style={{ fontSize: '0.85rem', color: 'white', marginBottom: '14px', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '10px' }}>
                                        📍 {res.address}
                                    </div>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <AdminButton
                                        variant={res.payment_status === 'Pago' ? 'success' : 'warning'}
                                        onClick={() => toggleStatus(res.id, 'payment_status', res.payment_status === 'Pago' ? 'Pendente' : 'Pago')}
                                    >
                                        {res.payment_status === 'Pago' ? '✅ Pago' : '⏳ Pendente'}
                                    </AdminButton>
                                    <AdminButton
                                        variant={res.pickup_status === 'Retirado' ? 'info' : 'secondary'}
                                        onClick={() => toggleStatus(res.id, 'pickup_status', res.pickup_status === 'Retirado' ? 'Pendente' : 'Retirado')}
                                    >
                                        {res.pickup_status === 'Retirado' ? '✅ Finalizado' : '⏳ Pendente'}
                                    </AdminButton>
                                    <AdminButton variant="secondary" onClick={() => { setEditingReservation(res); setIsEditModalOpen(true); }}>
                                        📝 Editar
                                    </AdminButton>
                                    <AdminButton
                                        variant="success"
                                        onClick={() => generatePix(res)}
                                        style={{ background: 'rgba(212,160,23,0.1)', color: 'var(--primary)', borderColor: 'var(--primary)' }}
                                    >
                                        📲 PIX
                                    </AdminButton>
                                </div>
                            </GlassPanel>
                        ))}
                    </div>

                    {/* Pagination */}
                    <Pagination
                        currentPage={result.page}
                        totalPages={result.totalPages}
                        totalItems={result.total}
                        pageSize={result.pageSize}
                        onPageChange={(page) => fetchReservations(page, searchTerm)}
                        loading={loading}
                    />
                </>
            )}

            {/* ── Modais ── */}

            {/* Edit Modal */}
            <AdminModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title={`Editar Reserva #${editingReservation?.id}`}
            >
                {editingReservation && (
                    <ReservationForm
                        reservation={editingReservation}
                        onSuccess={() => { setIsEditModalOpen(false); fetchReservations(currentPage, searchTerm); }}
                    />
                )}
            </AdminModal>

            {/* Delete Modal */}
            <AdminModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                title="Excluir reserva?"
            >
                {deleteTarget && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ 
                            width: "80px", height: "80px", borderRadius: "100px", 
                            background: "rgba(231, 76, 60, 0.1)", color: "#e74c3c",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            margin: "0 auto 24px"
                        }}>
                            <Trash2 size={40} className="delete-icon-pulse" />
                        </div>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '32px', lineHeight: 1.6 }}>
                            Você está prestes a excluir permanentemente o pedido de<br />
                            <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>
                                #{deleteTarget.id} — {deleteTarget.customer_name}
                            </strong>
                        </p>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <AdminButton variant="secondary" fullWidth onClick={() => setDeleteTarget(null)} disabled={deleting}>
                                Voltar
                            </AdminButton>
                            <AdminButton variant="danger" fullWidth onClick={confirmDelete} loading={deleting}>
                                Excluir
                            </AdminButton>
                        </div>
                    </div>
                )}
            </AdminModal>

            {/* PIX Modal */}
            <AdminModal
                isOpen={showPixModal}
                onClose={() => setShowPixModal(false)}
                title="QR Code PIX"
            >
                <div style={{ textAlign: 'center' }}>
                    <p className="text-sm" style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
                        Pedido #{activeResId} — {reservations.find(r => r.id === activeResId)?.customer_name}
                    </p>
                    {pixData && (
                        <div style={{
                            background: 'white', padding: '16px', borderRadius: '24px',
                            display: 'inline-block', marginBottom: '24px', boxShadow: '0 0 30px rgba(212, 160, 23, 0.2)',
                        }}>
                            <img src={`data:image/png;base64,${pixData.qr_code_base64}`} alt="QR Code PIX" style={{ width: '200px', height: '200px' }} />
                        </div>
                    )}
                    <AdminButton
                        fullWidth
                        onClick={() => { if (pixData) { navigator.clipboard.writeText(pixData.qr_code); toast.success('Chave copiada! 📋'); } }}
                        style={{ padding: '16px', fontSize: '1rem' }}
                    >
                        Copiar Chave PIX
                    </AdminButton>
                    <AdminButton variant="ghost" fullWidth onClick={() => setShowPixModal(false)} style={{ marginTop: '10px', textDecoration: 'underline' }}>
                        Fechar
                    </AdminButton>
                </div>
            </AdminModal>
        </AdminPageLayout>
    );
}
