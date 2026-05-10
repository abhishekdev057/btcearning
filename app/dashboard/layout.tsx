import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <SidebarProvider>
      <DashboardSidebar user={user} profile={profile} />
      <SidebarInset className="relative min-h-svh bg-transparent">
        <div className="pointer-events-none absolute inset-0 -z-10 ledger-grid opacity-35" />
        <DashboardHeader user={user} profile={profile} />
        <main className="flex-1 overflow-auto p-4 md:p-7">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
