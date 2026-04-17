'use server'

import { prisma } from '@/lib/prisma'
import { createSession, deleteSession } from '@/lib/session'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email e senha são obrigatórios' }
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return { error: 'Email ou senha inválidos' }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return { error: 'Email ou senha inválidos' }

  await createSession(user.id, user.email, user.name)
  redirect('/')
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}
