import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Cria usuário admin
  const hashedPassword = await bcrypt.hash('admin123', 12)
  await prisma.user.upsert({
    where: { email: 'admin@beachtennis.com' },
    update: {},
    create: {
      email: 'admin@beachtennis.com',
      password: hashedPassword,
      name: 'Administrador',
    },
  })

  // Cria quadras padrão
  const quadras = [
    { nome: 'Quadra 1', coberta: true },
    { nome: 'Quadra 2', coberta: true },
    { nome: 'Quadra 3', coberta: false },
    { nome: 'Quadra 4', coberta: true },
    { nome: 'Quadra 5', coberta: false },
    { nome: 'Quadra 6', coberta: true },
  ]
  for (const q of quadras) {
    const id = q.nome.toLowerCase().replace(' ', '-')
    await prisma.quadra.upsert({
      where: { id },
      update: { coberta: q.coberta },
      create: { id, nome: q.nome, coberta: q.coberta },
    })
  }

  // Cria produtos padrão
  const produtos = [
    { nome: 'Água Mineral 500ml', preco: 5.0 },
    { nome: 'Refrigerante Lata', preco: 7.0 },
    { nome: 'Isotônico', preco: 8.0 },
    { nome: 'Cerveja', preco: 10.0 },
    { nome: 'Suco Natural', preco: 9.0 },
    { nome: 'Combo Beach (2 Raquetes + 2 Bolas)', preco: 30.0 },
  ]

  for (const p of produtos) {
    const exists = await prisma.produto.findFirst({ where: { nome: p.nome } })
    if (!exists) {
      await prisma.produto.create({ data: p })
    }
  }

  console.log('✅ Seed concluído!')
  console.log('📧 Email: admin@beachtennis.com')
  console.log('🔑 Senha: admin123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
