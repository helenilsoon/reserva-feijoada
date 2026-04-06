"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus, Trash2, Shield, ShieldCheck, ToggleLeft, ToggleRight, X, Eye, EyeOff, Pencil, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import AdminPageLayout from "@/components/admin/AdminPageLayout";
import GlassPanel from "@/components/admin/GlassPanel";
import AdminButton from "@/components/admin/AdminButton";

interface AdminUser {
    id: string;
    name: string;
    email: string;
    role: "superadmin" | "admin";
    is_active: boolean;
    created_at: string;
}

interface NewUserForm {
    name: string;
    email: string;
    password: string;
    role: "admin" | "superadmin";
}

interface EditUserForm {
    name: string;
    email: string;
    password: string;
}

const inputStyle = {
    width: "100%",
    padding: "14px 16px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid var(--glass-border)",
    borderRadius: "12px",
    color: "white",
    fontSize: "0.95rem",
    outline: "none",
    boxSizing: "border-box" as const,
};

export default function UsersPage() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal criar
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showCreatePassword, setShowCreatePassword] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createForm, setCreateForm] = useState<NewUserForm>({ name: "", email: "", password: "", role: "admin" });

    // Modal editar
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [showEditPassword, setShowEditPassword] = useState(false);
    const [editForm, setEditForm] = useState<EditUserForm>({ name: "", email: "", password: "" });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/admin/users");
            if (res.ok) {
                setUsers(await res.json());
            } else {
                toast.error("Erro ao carregar usuários");
            }
        } catch {
            toast.error("Erro de conexão");
        } finally {
            setLoading(false);
        }
    };

    const openEdit = (user: AdminUser) => {
        setEditingUser(user);
        setEditForm({ name: user.name, email: user.email, password: "" });
        setShowEditPassword(false);
    };

    const closeEdit = () => {
        setEditingUser(null);
        setEditForm({ name: "", email: "", password: "" });
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(createForm),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(`Usuário ${data.name} criado com sucesso!`);
                setUsers(prev => [data, ...prev]);
                setShowCreateModal(false);
                setCreateForm({ name: "", email: "", password: "", role: "admin" });
            } else {
                toast.error(data.error || "Erro ao criar usuário");
            }
        } catch {
            toast.error("Erro de conexão");
        } finally {
            setCreating(false);
        }
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        setSaving(true);

        const payload: Record<string, string> = {
            name: editForm.name,
            email: editForm.email,
        };
        if (editForm.password) payload.password = editForm.password;

        try {
            const res = await fetch(`/api/admin/users/${editingUser.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (res.ok) {
                setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...data } : u));
                toast.success("Usuário atualizado com sucesso!");
                closeEdit();
            } else {
                toast.error(data.error || "Erro ao atualizar usuário");
            }
        } catch {
            toast.error("Erro de conexão");
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (user: AdminUser) => {
        const original = users;
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
        try {
            const res = await fetch(`/api/admin/users/${user.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_active: !user.is_active }),
            });
            if (!res.ok) {
                setUsers(original);
                const data = await res.json();
                toast.error(data.error || "Erro ao atualizar usuário");
            } else {
                toast.success(!user.is_active ? "Usuário ativado" : "Usuário desativado");
            }
        } catch {
            setUsers(original);
            toast.error("Erro de conexão");
        }
    };

    const handleDelete = async (user: AdminUser) => {
        if (!confirm(`Tem certeza que deseja excluir ${user.name}? Esta ação não pode ser desfeita.`)) return;
        try {
            const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
            const data = await res.json();
            if (res.ok) {
                setUsers(prev => prev.filter(u => u.id !== user.id));
                toast.success("Usuário removido");
            } else {
                toast.error(data.error || "Erro ao remover usuário");
            }
        } catch {
            toast.error("Erro de conexão");
        }
    };

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

    const actions = (
        <AdminButton icon={UserPlus} onClick={() => setShowCreateModal(true)} style={{ padding: "10px 20px" }}>
            Novo Usuário
        </AdminButton>
    );

    return (
        <AdminPageLayout
            title="Usuários"
            subtitle="Gerencie os administradores que têm acesso ao painel."
            actions={actions}
            backPath="/admin"
        >
            {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
                    <div className="loader" />
                </div>
            ) : (
                <GlassPanel>
                    {users.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
                            <Users size={48} style={{ margin: "0 auto 16px", opacity: 0.3 }} />
                            <p>Nenhum usuário cadastrado ainda.</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid var(--glass-border)" }}>
                                        {["Usuário", "Role", "Status", "Cadastrado em", "Ações"].map(h => (
                                            <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user, i) => (
                                        <motion.tr
                                            key={user.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                                        >
                                            <td style={{ padding: "16px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                    <div style={{
                                                        width: "40px", height: "40px", borderRadius: "12px",
                                                        background: user.role === "superadmin" ? "rgba(212,160,23,0.15)" : "rgba(255,255,255,0.05)",
                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                        border: `1px solid ${user.role === "superadmin" ? "rgba(212,160,23,0.3)" : "var(--glass-border)"}`,
                                                        color: user.role === "superadmin" ? "var(--primary)" : "var(--text-muted)",
                                                        fontSize: "1rem", fontWeight: 700, flexShrink: 0
                                                    }}>
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p style={{ color: "white", fontWeight: 600, marginBottom: "2px" }}>{user.name}</p>
                                                        <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: "16px" }}>
                                                <span style={{
                                                    display: "inline-flex", alignItems: "center", gap: "6px",
                                                    padding: "4px 12px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 600,
                                                    background: user.role === "superadmin" ? "rgba(212,160,23,0.15)" : "rgba(255,255,255,0.06)",
                                                    color: user.role === "superadmin" ? "var(--primary)" : "var(--text-muted)",
                                                    border: `1px solid ${user.role === "superadmin" ? "rgba(212,160,23,0.3)" : "var(--glass-border)"}`,
                                                }}>
                                                    {user.role === "superadmin" ? <ShieldCheck size={14} /> : <Shield size={14} />}
                                                    {user.role === "superadmin" ? "Superadmin" : "Admin"}
                                                </span>
                                            </td>
                                            <td style={{ padding: "16px" }}>
                                                <button
                                                    onClick={() => toggleActive(user)}
                                                    disabled={user.role === "superadmin"}
                                                    title={user.role === "superadmin" ? "Não é possível desativar superadmin" : undefined}
                                                    style={{
                                                        display: "inline-flex", alignItems: "center", gap: "6px",
                                                        padding: "4px 12px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 600,
                                                        background: user.is_active ? "rgba(37,211,102,0.12)" : "rgba(231,76,60,0.12)",
                                                        color: user.is_active ? "#25d366" : "#e74c3c",
                                                        border: `1px solid ${user.is_active ? "rgba(37,211,102,0.3)" : "rgba(231,76,60,0.3)"}`,
                                                        cursor: user.role === "superadmin" ? "default" : "pointer",
                                                        transition: "all 0.2s"
                                                    }}
                                                >
                                                    {user.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                                                    {user.is_active ? "Ativo" : "Inativo"}
                                                </button>
                                            </td>
                                            <td style={{ padding: "16px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                                                {formatDate(user.created_at)}
                                            </td>
                                            <td style={{ padding: "16px" }}>
                                                <div style={{ display: "flex", gap: "8px" }}>
                                                    {/* Botão Editar — disponível para todos (inclusive superadmin editar a si mesmo) */}
                                                    <button
                                                        onClick={() => openEdit(user)}
                                                        title="Editar usuário"
                                                        style={{
                                                            background: "rgba(212,160,23,0.1)",
                                                            border: "1px solid rgba(212,160,23,0.3)",
                                                            color: "var(--primary)",
                                                            borderRadius: "8px",
                                                            padding: "8px",
                                                            cursor: "pointer",
                                                            transition: "all 0.2s",
                                                            display: "flex", alignItems: "center"
                                                        }}
                                                    >
                                                        <Pencil size={15} />
                                                    </button>
                                                    {/* Botão Deletar — não disponível para superadmin */}
                                                    {user.role !== "superadmin" && (
                                                        <button
                                                            onClick={() => handleDelete(user)}
                                                            title="Remover usuário"
                                                            style={{
                                                                background: "rgba(231,76,60,0.1)",
                                                                border: "1px solid rgba(231,76,60,0.3)",
                                                                color: "#e74c3c",
                                                                borderRadius: "8px",
                                                                padding: "8px",
                                                                cursor: "pointer",
                                                                transition: "all 0.2s",
                                                                display: "flex", alignItems: "center"
                                                            }}
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </GlassPanel>
            )}

            {/* ── Modal: Criar Usuário ─────────────────────────────────────── */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}
                        onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="glass-panel" style={{ width: "100%", maxWidth: "440px", padding: "32px" }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
                                <div>
                                    <h2 style={{ color: "white", fontFamily: "Outfit, sans-serif", fontSize: "1.3rem", marginBottom: "4px" }}>Novo Usuário</h2>
                                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Preencha os dados do novo administrador.</p>
                                </div>
                                <button onClick={() => setShowCreateModal(false)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--glass-border)", borderRadius: "8px", padding: "8px", cursor: "pointer", color: "var(--text-muted)" }}>
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>Nome completo</label>
                                    <input type="text" placeholder="Ex: João Silva" value={createForm.name} onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))} required style={inputStyle} className="input-focus" />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>Email</label>
                                    <input type="email" placeholder="email@exemplo.com" value={createForm.email} onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))} required style={inputStyle} className="input-focus" />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>Senha (mín. 8 caracteres)</label>
                                    <div style={{ position: "relative" }}>
                                        <input type={showCreatePassword ? "text" : "password"} placeholder="Senha segura" value={createForm.password} onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))} required minLength={8} style={{ ...inputStyle, padding: "14px 48px 14px 16px" }} className="input-focus" />
                                        <button type="button" onClick={() => setShowCreatePassword(!showCreatePassword)} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex" }}>
                                            {showCreatePassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>Nível de acesso</label>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                        {(["admin", "superadmin"] as const).map(role => (
                                            <button key={role} type="button" onClick={() => setCreateForm(p => ({ ...p, role }))} style={{ padding: "12px", borderRadius: "12px", border: `1px solid ${createForm.role === role ? "var(--primary)" : "var(--glass-border)"}`, background: createForm.role === role ? "rgba(212,160,23,0.1)" : "rgba(255,255,255,0.03)", color: createForm.role === role ? "var(--primary)" : "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "0.85rem", fontWeight: 600, transition: "all 0.2s" }}>
                                                {role === "superadmin" ? <ShieldCheck size={16} /> : <Shield size={16} />}
                                                {role === "superadmin" ? "Superadmin" : "Admin"}
                                            </button>
                                        ))}
                                    </div>
                                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "8px" }}>
                                        {createForm.role === "superadmin" ? "⚠️ Superadmin pode criar e gerenciar outros usuários." : "Admin tem acesso ao painel mas não pode gerenciar usuários."}
                                    </p>
                                </div>
                                <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                                    <button type="button" onClick={() => setShowCreateModal(false)} style={{ flex: 1, padding: "14px", borderRadius: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--glass-border)", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.95rem" }}>Cancelar</button>
                                    <AdminButton type="submit" loading={creating} icon={UserPlus} style={{ flex: 1, padding: "14px", borderRadius: "12px", fontSize: "0.95rem" }}>Criar Usuário</AdminButton>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Modal: Editar Usuário ────────────────────────────────────── */}
            <AnimatePresence>
                {editingUser && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}
                        onClick={(e) => e.target === e.currentTarget && closeEdit()}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="glass-panel" style={{ width: "100%", maxWidth: "440px", padding: "32px" }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
                                <div>
                                    <h2 style={{ color: "white", fontFamily: "Outfit, sans-serif", fontSize: "1.3rem", marginBottom: "4px" }}>Editar Usuário</h2>
                                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                                        Editando: <strong style={{ color: "var(--primary)" }}>{editingUser.name}</strong>
                                    </p>
                                </div>
                                <button onClick={closeEdit} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--glass-border)", borderRadius: "8px", padding: "8px", cursor: "pointer", color: "var(--text-muted)" }}>
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleEdit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>Nome completo</label>
                                    <input type="text" placeholder="Nome" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} required style={inputStyle} className="input-focus" />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>Email</label>
                                    <input type="email" placeholder="email@exemplo.com" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} required style={inputStyle} className="input-focus" />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>
                                        Nova senha <span style={{ color: "rgba(255,255,255,0.3)", textTransform: "none", letterSpacing: 0 }}>(deixe em branco para não alterar)</span>
                                    </label>
                                    <div style={{ position: "relative" }}>
                                        <input type={showEditPassword ? "text" : "password"} placeholder="Nova senha (opcional)" value={editForm.password} onChange={e => setEditForm(p => ({ ...p, password: e.target.value }))} minLength={editForm.password ? 8 : undefined} style={{ ...inputStyle, padding: "14px 48px 14px 16px" }} className="input-focus" />
                                        <button type="button" onClick={() => setShowEditPassword(!showEditPassword)} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex" }}>
                                            {showEditPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                                    <button type="button" onClick={closeEdit} style={{ flex: 1, padding: "14px", borderRadius: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--glass-border)", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.95rem" }}>Cancelar</button>
                                    <AdminButton type="submit" loading={saving} icon={Save} style={{ flex: 1, padding: "14px", borderRadius: "12px", fontSize: "0.95rem" }}>Salvar</AdminButton>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AdminPageLayout>
    );
}
