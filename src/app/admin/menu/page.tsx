"use client";

import { useState, useEffect } from "react";
import AdminPageLayout from "@/components/admin/AdminPageLayout";
import GlassPanel from "@/components/admin/GlassPanel";
import AdminButton from "@/components/admin/AdminButton";
import AdminInput from "@/components/admin/AdminInput";
import { Plus, Trash2, Save, X, Utensils, MoveUp, MoveDown, Check, AlertCircle, Pencil, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import AdminModal from "@/components/admin/AdminModal";

interface MenuItem {
    id?: number;
    category: string;
    title: string;
    description?: string | null;
    items: string[];
    price: number;
    active: boolean;
    order_index: number;
}

export default function AdminMenuPage() {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState<number | null>(null); // ID do item sendo editado
    const [isAdding, setIsAdding] = useState(false);
    
    // Estado para o formulário (adicionar/editar)
    const [formData, setFormData] = useState<MenuItem>({
        category: "",
        title: "",
        description: "",
        items: [],
        price: 0,
        active: true,
        order_index: 0
    });
    const [newItemText, setNewItemText] = useState("");
    const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchMenuItems();
    }, []);

    const fetchMenuItems = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/menu");
            if (res.ok) {
                const data = await res.json();
                setMenuItems(data);
            }
        } catch (error) {
            toast.error("Erro ao carregar cardápio");
        } finally {
            setLoading(false);
        }
    };

    const handleAddItemToData = () => {
        if (!newItemText.trim()) return;
        const currentItems = Array.isArray(formData.items) ? formData.items : [];
        setFormData({
            ...formData,
            items: [...currentItems, newItemText.trim()]
        });
        setNewItemText("");
    };

    const handleRemoveItem = (index: number) => {
        const currentItems = Array.isArray(formData.items) ? formData.items : [];
        setFormData({
            ...formData,
            items: currentItems.filter((_, i) => i !== index)
        });
    };

    const startEditing = (item: MenuItem) => {
        setFormData({ ...item, description: item.description || "" });
        setIsEditing(item.id || null);
        setIsAdding(false);
    };

    const startAdding = () => {
        setFormData({
            category: "",
            title: "",
            description: "",
            items: [],
            price: 0,
            active: true,
            order_index: menuItems.length + 1
        });
        setIsAdding(true);
        setIsEditing(null);
    };

    const cancelEditing = () => {
        setIsEditing(null);
        setIsAdding(false);
    };

    const saveItem = async () => {
        if (!formData.category || !formData.title || formData.items.length === 0) {
            toast.error("Preencha categoria, título e pelo menos um item");
            return;
        }

        const method = isEditing ? "PUT" : "POST";
        const url = isEditing ? `/api/admin/menu/${isEditing}` : "/api/admin/menu";

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                toast.success(isEditing ? "Item atualizado!" : "Item criado!");
                cancelEditing();
                fetchMenuItems();
            } else {
                const err = await res.json();
                toast.error(err.error || "Erro ao salvar");
            }
        } catch (error) {
            toast.error("Erro na requisição");
        }
    };

    const deleteItem = async (id: number) => {
        setDeleting(true);
        try {
            const res = await fetch(`/api/admin/menu/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Item removido");
                setDeleteTarget(null);
                fetchMenuItems();
            } else {
                toast.error("Erro ao excluir");
            }
        } catch (error) {
            toast.error("Erro ao excluir");
        } finally {
            setDeleting(false);
        }
    };

    const toggleStatus = async (item: MenuItem) => {
        try {
            const res = await fetch(`/api/admin/menu/${item.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ active: !item.active })
            });
            if (res.ok) {
                fetchMenuItems();
            }
        } catch (error) {
            toast.error("Erro ao mudar status");
        }
    };

    return (
        <AdminPageLayout 
            title="Gestão do Cardápio" 
            subtitle="Configure as seções, categorias e itens que aparecem para os clientes."
            backPath="/admin"
            actions={
                <AdminButton icon={Plus} onClick={startAdding} variant="primary">
                    Novo Item
                </AdminButton>
            }
        >
            <div style={{ display: "grid", gap: "24px" }}>
                
                {/* Formulário de Edição/Criação */}
                <AnimatePresence>
                    {(isEditing || isAdding) && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <GlassPanel style={{ border: "2px solid var(--primary)", position: "relative" }}>
                                <h3 className="title-sm" style={{ color: "white", marginBottom: "24px" }}>
                                    {isEditing ? "Editar Seção" : "Nova Seção de Cardápio"}
                                </h3>
                                
                                <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr", gap: "20px", marginBottom: "20px" }}>
                                    <AdminInput 
                                        label="Categoria" 
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: (e.target as HTMLInputElement).value })}
                                        placeholder="Ex: Bebidas"
                                    />
                                    <AdminInput 
                                        label="Título da Seção" 
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: (e.target as HTMLInputElement).value })}
                                        placeholder="Ex: Sucos Naturais"
                                    />
                                    <AdminInput 
                                        label="Preço (R$)" 
                                        type="number"
                                        value={formData.price === undefined ? "" : formData.price}
                                        onChange={(e) => {
                                            const val = (e.target as HTMLInputElement).value;
                                            setFormData({ ...formData, price: val === "" ? 0 : parseFloat(val) });
                                        }}
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0"
                                    />
                                </div>

                                <AdminInput 
                                    label="Breve Descrição (opcional)" 
                                    value={formData.description || ""}
                                    onChange={(e) => setFormData({ ...formData, description: (e.target as HTMLInputElement).value })}
                                    placeholder="Ex: Feijão selecionado com carnes premium..."
                                />

                                <div style={{ marginTop: "24px", marginBottom: "24px" }}>
                                    <label style={{ display: "block", color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "8px", fontWeight: 600 }}>
                                        Itens desta Seção
                                    </label>
                                    <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                                        <AdminInput 
                                            value={newItemText}
                                            onChange={(e) => setNewItemText((e.target as HTMLInputElement).value)}
                                            placeholder="Nome do item (ex: Arroz Branco)"
                                            style={{ marginBottom: 0 }}
                                            onKeyPress={(e) => e.key === 'Enter' && handleAddItemToData()}
                                        />
                                        <AdminButton icon={Plus} onClick={handleAddItemToData} variant="secondary" style={{ flexShrink: 0 }}>
                                            Add
                                        </AdminButton>
                                    </div>

                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                        {formData.items.map((item, idx) => (
                                            <div key={idx} style={{ 
                                                background: "rgba(212, 160, 23, 0.15)", 
                                                padding: "6px 12px", 
                                                borderRadius: "10px", 
                                                display: "flex", 
                                                alignItems: "center", 
                                                gap: "8px",
                                                border: "1px solid rgba(212, 160, 23, 0.3)"
                                            }}>
                                                <span style={{ fontSize: "0.9rem", color: "white" }}>{item}</span>
                                                <button onClick={() => handleRemoveItem(idx)} style={{ background: "transparent", color: "var(--primary)", border: "none", padding: 0 }}>
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        {formData.items.length === 0 && (
                                            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontStyle: "italic" }}>
                                                Nenhum item adicionado ainda.
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "32px" }}>
                                    <AdminButton icon={X} onClick={cancelEditing} variant="secondary">
                                        Cancelar
                                    </AdminButton>
                                    <AdminButton icon={Save} onClick={saveItem} variant="primary">
                                        {isEditing ? "Salvar Alterações" : "Criar Seção"}
                                    </AdminButton>
                                </div>
                            </GlassPanel>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Lista de Itens */}
                <div style={{ display: "grid", gap: "16px" }}>
                    {loading ? (
                        <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px" }}>Carregando dados do cardápio...</p>
                    ) : menuItems.length === 0 ? (
                        <GlassPanel style={{ textAlign: "center", padding: "60px" }}>
                            <Utensils size={48} style={{ color: "var(--text-muted)", marginBottom: "16px", opacity: 0.5 }} />
                            <h4 style={{ color: "white", marginBottom: "8px" }}>Cardápio Vazio</h4>
                            <p style={{ color: "var(--text-muted)" }}>Nenhum item cadastrado no banco de dados ainda.</p>
                        </GlassPanel>
                    ) : (
                        menuItems.map((item) => (
                            <motion.div key={item.id} layout>
                                <GlassPanel style={{ 
                                    padding: "20px 24px", 
                                    display: "flex", 
                                    alignItems: "center", 
                                    justifyContent: "space-between",
                                    borderLeft: `4px solid ${item.active ? "var(--primary)" : "transparent"}`,
                                    opacity: item.active ? 1 : 0.6
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                                        <div style={{ 
                                            width: "48px", height: "48px", borderRadius: "12px", 
                                            background: "rgba(212, 160, 23, 0.1)", 
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            color: "var(--primary)"
                                        }}>
                                            <Utensils size={24} />
                                        </div>
                                        <div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <span className="badge badge-warning" style={{ fontSize: "0.65rem", padding: "2px 8px" }}>
                                                    {item.category}
                                                </span>
                                                <h4 style={{ color: "white", margin: 0, fontSize: "1.1rem" }}>{item.title}</h4>
                                            </div>
                                            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "4px 0 0 0" }}>
                                                {item.items.length} itens • {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                                            </p>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", gap: "10px" }}>
                                        <button 
                                            onClick={() => toggleStatus(item)}
                                            style={{ 
                                                background: item.active ? "rgba(37, 211, 102, 0.1)" : "rgba(255,255,255,0.05)",
                                                color: item.active ? "#25d366" : "var(--text-muted)",
                                                border: "none", padding: "10px", borderRadius: "12px",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                transition: "all 0.2s ease"
                                            }}
                                            className="tap-feedback"
                                            title={item.active ? "Ocultar do site" : "Mostrar no site"}
                                        >
                                            {item.active ? <Eye size={20} /> : <EyeOff size={20} />}
                                        </button>
                                        <button 
                                            onClick={() => startEditing(item)}
                                            style={{ 
                                                background: "rgba(212, 160, 23, 0.1)", 
                                                color: "var(--primary)", 
                                                border: "none", padding: "10px", borderRadius: "12px",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                transition: "all 0.2s ease"
                                            }}
                                            className="tap-feedback"
                                            title="Editar esta seção"
                                        >
                                            <Pencil size={20} />
                                        </button>
                                        <button 
                                            onClick={() => setDeleteTarget(item.id!)}
                                            style={{ 
                                                background: "rgba(231, 76, 60, 0.1)", 
                                                color: "#e74c3c", 
                                                border: "none", padding: "10px", borderRadius: "12px",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                transition: "all 0.2s ease"
                                            }}
                                            className="tap-feedback"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </GlassPanel>
                            </motion.div>
                        ))
                    )}
                </div>

                <GlassPanel style={{ background: "rgba(212, 160, 23, 0.05)", display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <AlertCircle style={{ color: "var(--primary)", flexShrink: 0 }} />
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
                        <strong>Dica:</strong> Organize seu cardápio em categorias claras (ex: Marmitas, Bebidas, Sobremesas). 
                        Cada seção em uma categoria aparecerá como um item expansível no site para o cliente.
                    </p>
                </GlassPanel>

                {/* Modal de Exclusão Elegante */}
                <AdminModal
                    isOpen={!!deleteTarget}
                    onClose={() => setDeleteTarget(null)}
                    title="Excluir Seção do Cardápio?"
                >
                    <div style={{ textAlign: "center", padding: "10px 0" }}>
                        <div style={{ 
                            width: "80px", height: "80px", borderRadius: "100px", 
                            background: "rgba(231, 76, 60, 0.1)", color: "#e74c3c",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            margin: "0 auto 24px"
                        }}>
                            <Trash2 size={40} className="delete-icon-pulse" />
                        </div>
                        
                        <p style={{ color: "white", fontSize: "1.1rem", marginBottom: "8px", fontWeight: 600 }}>
                            Tem certeza que deseja apagar?
                        </p>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "32px", lineHeight: 1.6 }}>
                            Esta ação é irreversível e removerá todos os itens desta seção (ex: {menuItems.find(i => i.id === deleteTarget)?.title}) do cardápio visível para os clientes.
                        </p>

                        <div style={{ display: "flex", gap: "12px" }}>
                            <AdminButton fullWidth variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                                Cancelar
                            </AdminButton>
                            <AdminButton fullWidth variant="danger" onClick={() => deleteTarget && deleteItem(deleteTarget)} loading={deleting}>
                                Sim, Excluir
                            </AdminButton>
                        </div>
                    </div>
                </AdminModal>
            </div>
        </AdminPageLayout>
    );
}
