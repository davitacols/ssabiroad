"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, Map, BarChart2, Settings, LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/ThemeToggle"

interface AppSidebarProps {
  onLogout: () => void
}

export function AppSidebar({ onLogout }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader className="flex items-center justify-between p-4">
        <span className="text-xl font-bold">BuildingDetector</span>
        <ThemeToggle />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/dashboard"}>
              <Link href="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/search"}>
              <Link href="/search">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/map"}>
              <Link href="/map">
                <Map className="mr-2 h-4 w-4" />
                Map
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/analytics"}>
              <Link href="/analytics">
                <BarChart2 className="mr-2 h-4 w-4" />
                Analytics
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/settings"}>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <Button variant="outline" className="w-full" onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}

