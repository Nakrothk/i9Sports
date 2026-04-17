# 🎾 Beach Tennis Manager — Setup

## Pré-requisitos
- Node.js 18+
- PostgreSQL rodando localmente (ou Railway/Neon para deploy)

## 1. Configurar banco de dados

Edite o arquivo `.env` com sua string de conexão PostgreSQL:
```
DATABASE_URL="postgresql://usuario:senha@localhost:5432/beach_tennis"
SESSION_SECRET="troque-por-uma-string-longa-e-aleatoria"
```

## 2. Instalar dependências
```bash
npm install
```

## 3. Criar tabelas e seed
```bash
npx prisma db push
npx prisma db seed
```

Isso cria as tabelas e o usuário admin:
- **Email:** admin@beachtennis.com
- **Senha:** admin123

## 4. Rodar em desenvolvimento
```bash
npm run dev
```

Acesse: http://localhost:3000

---

## Deploy (Vercel + Railway/Neon)

### Banco: Railway ou Neon (PostgreSQL gratuito)
1. Crie um banco em [railway.app](https://railway.app) ou [neon.tech](https://neon.tech)
2. Copie a DATABASE_URL

### Frontend: Vercel
1. Faça push do projeto no GitHub
2. Importe no [vercel.com](https://vercel.com)
3. Adicione as variáveis de ambiente:
   - `DATABASE_URL` — string do banco
   - `SESSION_SECRET` — string longa aleatória
4. Deploy!

### Após deploy, rode o seed:
```bash
npx prisma db seed
```

---

## Módulos
- **Dashboard** — visão geral do dia
- **Agendamento** — grade de horários por quadra
- **Comandas** — controle de consumo dos clientes
- **Produtos** — cadastro de produtos/bebidas
