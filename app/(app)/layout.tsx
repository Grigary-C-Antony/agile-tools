import { Sidebar } from '@/components/layout/Sidebar'
import { TopNav } from '@/components/layout/TopNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <TopNav />
      <main className="ml-64 pt-16 min-h-screen">
        {children}
      </main>
    </div>
  )
}
