import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer-root">
      <div className="footer-inner">
        <div className="footer-copy">
          <p className="footer-brand">© 2026 Sabor &amp; Tradição</p>
          <p className="footer-rights">Todos os direitos reservados.</p>
        </div>
        <Link href="/admin" className="footer-admin-link">
          Acessar Painel Administrador
        </Link>
      </div>
    </footer>
  );
}
