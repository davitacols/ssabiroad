"use client"
import { usePathname } from "next/navigation"
import { Home, Search, Map, BarChart2, Settings, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarNav,
  SidebarNavLink,
} from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"

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
        <SidebarNav>
          <SidebarNavLink href="/search" active={pathname === "/search"}>
            <Search className="mr-2 h-4 w-4" />
            Search
          </SidebarNavLink>
          <SidebarNavLink href="/map" active={pathname === "/map"}>
            <Map className="mr-2 h-4 w-4" />
            Map
          </SidebarNavLink>
          <SidebarNavLink href="/analytics" active={pathname === "/analytics"}>
            <BarChart2 className="mr-2 h-4 w-4" />
            Analytics
          </SidebarNavLink>
          <SidebarNavLink href="/settings" active={pathname === "/settings"}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </SidebarNavLink>
        </SidebarNav>
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

