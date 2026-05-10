'use client'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import {
  Bitcoin,
  LayoutDashboard,
  Play,
  Droplets,
  Users,
  Wallet,
  History,
  Megaphone,
  BarChart3,
  PlusCircle,
  LogOut,
  Settings,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'
import { formatSatoshi } from '@/lib/types'

interface DashboardSidebarProps {
  user: User
  profile: Profile | null
}

const earnerNavItems = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Surf Ads', href: '/dashboard/surf', icon: Play },
  { title: 'Faucet', href: '/dashboard/faucet', icon: Droplets },
  { title: 'Referrals', href: '/dashboard/referrals', icon: Users },
  { title: 'Withdraw', href: '/dashboard/withdraw', icon: Wallet },
  { title: 'History', href: '/dashboard/history', icon: History },
]

const advertiserNavItems = [
  { title: 'My Campaigns', href: '/dashboard/advertiser', icon: Megaphone },
  { title: 'Create Ad', href: '/dashboard/advertiser/create', icon: PlusCircle },
  { title: 'Statistics', href: '/dashboard/advertiser/stats', icon: BarChart3 },
]

export function DashboardSidebar({ user, profile }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <Sidebar className="border-sidebar-border/70">
      <SidebarHeader className="border-b border-sidebar-border/70">
        <Link href="/dashboard" className="flex items-center gap-3 px-2 py-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Bitcoin className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold text-sidebar-foreground">CryptoBTC</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* Balance Card */}
        <SidebarGroup>
          <div className="shine-edge rounded-xl border border-primary/20 bg-primary/10 p-3">
            <p className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Your Balance</p>
            <p className="text-xl font-bold text-primary">
              {formatSatoshi(profile?.btc_balance || 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Total Earned: {formatSatoshi(profile?.total_earned || 0)}
            </p>
          </div>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Earner Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Earn</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {earnerNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Advertiser Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Advertise</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {advertiserNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <Link href="/dashboard/settings">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip="Logout">
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="px-2 py-1 text-xs text-muted-foreground truncate">
          {user.email}
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
