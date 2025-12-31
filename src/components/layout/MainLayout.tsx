import { ReactNode } from 'react'
import { Header } from './Header'

interface MainLayoutProps {
  children: ReactNode
  calendarSection?: ReactNode
}

export function MainLayout({ children, calendarSection }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header calendarSection={calendarSection} />
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
