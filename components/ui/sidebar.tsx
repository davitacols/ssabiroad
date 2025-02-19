"use client"

import * as React from "react"
import Link from "next/link"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const sidebarVariants = cva(
  "fixed left-0 top-0 z-40 h-screen w-64 transform transition-transform duration-300 ease-in-out",
  {
    variants: {
      variant: {
        default: "bg-background border-r",
        overlay: "bg-background/80 backdrop-blur-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof sidebarVariants> {}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(({ className, variant, ...props }, ref) => (
  <div ref={ref} className={cn(sidebarVariants({ variant }), className)} {...props} />
))
Sidebar.displayName = "Sidebar"

const SidebarHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center justify-between p-4", className)} {...props} />
  ),
)
SidebarHeader.displayName = "SidebarHeader"

const SidebarContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex-1 overflow-y-auto p-4", className)} {...props} />
  ),
)
SidebarContent.displayName = "SidebarContent"

const SidebarFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-4", className)} {...props} />,
)
SidebarFooter.displayName = "SidebarFooter"

const SidebarNav = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(({ className, ...props }, ref) => (
  <nav ref={ref} className={cn("space-y-1", className)} {...props} />
))
SidebarNav.displayName = "SidebarNav"

const SidebarNavLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<typeof Link> & { active?: boolean }
>(({ className, active, ...props }, ref) => (
  <Link
    ref={ref}
    className={cn(
      "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      className,
    )}
    {...props}
  />
))
SidebarNavLink.displayName = "SidebarNavLink"

const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

export { Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarNav, SidebarNavLink, SidebarProvider }

