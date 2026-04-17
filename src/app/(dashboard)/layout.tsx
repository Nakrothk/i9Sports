import { requireAuth } from '@/lib/auth'
import { Nav } from '@/components/nav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth()

  return (
    <div className="flex min-h-screen bg-muted/30">
      <Nav userName={session.name} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
