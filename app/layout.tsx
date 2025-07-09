import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth/AuthProvider"
import AuthWrapper from "@/components/auth/AuthWrapper"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TBKK-Surazense",
  description: "Monitor industrial sensors in real-time with TBKK-Surazense",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AuthProvider>
            <AuthWrapper>
              {children}
            </AuthWrapper>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
