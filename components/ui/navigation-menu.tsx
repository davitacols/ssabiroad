"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

// Create a context to manage the state of the navigation menu
const NavigationMenuContext = React.createContext<{
  activeIndex: number | null
  setActiveIndex: React.Dispatch<React.SetStateAction<number | null>>
}>({
  activeIndex: null,
  setActiveIndex: () => null,
})

const NavigationMenu = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const [activeIndex, setActiveIndex] = React.useState<number | null>(null)

    return (
      <NavigationMenuContext.Provider value={{ activeIndex, setActiveIndex }}>
        <div
          ref={ref}
          className={cn("relative z-10 flex max-w-max flex-1 items-center justify-center", className)}
          {...props}
        >
          {children}
        </div>
      </NavigationMenuContext.Provider>
    )
  },
)
NavigationMenu.displayName = "NavigationMenu"

const NavigationMenuList = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(
  ({ className, ...props }, ref) => (
    <ul
      ref={ref}
      className={cn("group flex flex-1 list-none items-center justify-center space-x-1", className)}
      {...props}
    />
  ),
)
NavigationMenuList.displayName = "NavigationMenuList"

const NavigationMenuItem = React.forwardRef<HTMLLIElement, React.HTMLAttributes<HTMLLIElement> & { index?: number }>(
  ({ className, index, ...props }, ref) => {
    const { activeIndex, setActiveIndex } = React.useContext(NavigationMenuContext)

    return (
      <li
        ref={ref}
        className={cn("relative", className)}
        onMouseEnter={() => {
          if (typeof index === "number") {
            setActiveIndex(index)
          }
        }}
        onMouseLeave={() => {
          if (typeof index === "number" && activeIndex === index) {
            setActiveIndex(null)
          }
        }}
        {...props}
      />
    )
  },
)
NavigationMenuItem.displayName = "NavigationMenuItem"

const navigationMenuTriggerStyle = (active?: boolean) =>
  cn(
    "group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors",
    "hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground focus:outline-none",
    "disabled:pointer-events-none disabled:opacity-50",
    active && "bg-muted/50",
  )

const NavigationMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { index?: number }
>(({ className, children, index, ...props }, ref) => {
  const { activeIndex } = React.useContext(NavigationMenuContext)
  const active = typeof index === "number" && activeIndex === index

  return (
    <button ref={ref} className={cn(navigationMenuTriggerStyle(active), "group", className)} {...props}>
      {children}{" "}
      <ChevronDown
        className={cn("relative top-[1px] ml-1 h-3 w-3 transition duration-200", active && "rotate-180")}
        aria-hidden="true"
      />
    </button>
  )
})
NavigationMenuTrigger.displayName = "NavigationMenuTrigger"

const NavigationMenuContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { index?: number }
>(({ className, index, ...props }, ref) => {
  const { activeIndex } = React.useContext(NavigationMenuContext)
  const active = typeof index === "number" && activeIndex === index

  return (
    <div
      ref={ref}
      className={cn(
        "absolute left-0 top-full mt-1.5 w-full overflow-hidden rounded-md border bg-background shadow-lg",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "z-50 origin-top",
        !active && "hidden",
        className,
      )}
      {...props}
    />
  )
})
NavigationMenuContent.displayName = "NavigationMenuContent"

// Simple wrapper for Link
const NavigationMenuLink: React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement> & { asChild?: boolean }> = ({
  className,
  children,
  href = "#",
  asChild,
  ...props
}) => {
  if (asChild) {
    return (
      <div className={className} {...props}>
        {children}
      </div>
    )
  }

  return (
    <Link
      href={href}
      className={cn(
        "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  )
}
NavigationMenuLink.displayName = "NavigationMenuLink"

// Viewport is not needed in this simplified version
const NavigationMenuViewport: React.FC<React.HTMLAttributes<HTMLDivElement>> = () => null

export {
  navigationMenuTriggerStyle,
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuViewport,
}

