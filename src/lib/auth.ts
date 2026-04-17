import 'server-only'
import { getSession } from './session'
import { redirect } from 'next/navigation'

export async function requireAuth() {
  const session = await getSession()
  if (!session) redirect('/login')
  return session
}

export async function getOptionalSession() {
  return getSession()
}
