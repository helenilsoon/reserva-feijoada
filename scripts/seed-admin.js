/**
 * Script para criar o primeiro superadmin no banco de dados.
 * 
 * Uso:
 *   node scripts/seed-admin.js
 * 
 * Ou com variáveis customizadas:
 *   ADMIN_NAME="Meu Nome" ADMIN_EMAIL="meu@email.com" ADMIN_PASSWORD="minhasenha" node scripts/seed-admin.js
 */

require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrada no .env.local');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

// Configurações do superadmin inicial
const ADMIN_NAME = process.env.ADMIN_NAME || 'Administrador';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@reservafeijoada.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin@2026!';

async function seed() {
  console.log('\n🌱 Iniciando seed do superadmin...\n');

  // Verifica se já existe algum superadmin
  const existing = await sql`
    SELECT COUNT(*) as count FROM admin_users WHERE role = 'superadmin'
  `;

  if (parseInt(existing[0].count) > 0) {
    console.log('⚠️  Já existe um superadmin cadastrado.');
    console.log('   Para criar outro, use a interface do painel em /admin/usuarios\n');
    
    const admins = await sql`SELECT name, email, role FROM admin_users ORDER BY created_at`;
    console.log('📋 Usuários existentes:');
    admins.forEach(u => {
      console.log(`   - ${u.name} (${u.email}) — ${u.role}`);
    });
    console.log();
    process.exit(0);
  }

  // Cria o superadmin
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const result = await sql`
    INSERT INTO admin_users (name, email, password_hash, role)
    VALUES (${ADMIN_NAME}, ${ADMIN_EMAIL.toLowerCase()}, ${passwordHash}, 'superadmin')
    RETURNING id, name, email, role
  `;

  const user = result[0];

  console.log('✅ Superadmin criado com sucesso!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   Nome:  ${user.name}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Senha: ${ADMIN_PASSWORD}`);
  console.log(`   Role:  ${user.role}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n⚠️  Altere a senha após o primeiro login!\n');
  console.log('🚀 Acesse: http://localhost:3000/admin/login\n');
}

seed().catch(err => {
  console.error('❌ Erro ao criar superadmin:', err.message);
  process.exit(1);
});
