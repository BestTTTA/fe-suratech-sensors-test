"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboardIcon as Dashboard, Menu, X } from "lucide-react"

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const navItems = [{ name: "Dashboard", href: "/", icon: Dashboard }]

  return (
    <aside
      className={`${
        collapsed ? "w-16" : "w-64"
      } bg-gray-800 border-r border-gray-700 transition-all duration-300 ease-in-out h-screen flex flex-col`}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {!collapsed && <h1 className="text-xl font-bold text-white">TBKK-Surazense</h1>}
        <button onClick={() => setCollapsed(!collapsed)} className="p-2 rounded-md hover:bg-gray-700 text-white">
          {collapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          // Check if the current path matches the nav item's href exactly
          // or if it's a subpath (for sensor detail pages)
          const isActive =
            pathname === item.href ||
            (item.href === "/" && pathname.startsWith("/sensors/")) ||
            (pathname.startsWith(item.href) && item.href !== "/")

          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center p-3 rounded-md transition-colors ${
                isActive ? "bg-blue-900 text-blue-200" : "hover:bg-gray-700 text-gray-200"
              }`}
            >
              <Icon size={20} />
              {!collapsed && <span className="ml-3">{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-700">
        {!collapsed && <div className="text-sm text-gray-400">v1.0.0</div>}
      </div>
    </aside>
  )
}
