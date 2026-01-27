import { ReactNode } from 'react'
import { Header } from './Header'

interface MainLayoutProps {
  children: ReactNode
  calendarSection?: ReactNode
  headerRight?: ReactNode
}

export function MainLayout({ children, calendarSection, headerRight }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header calendarSection={calendarSection} headerRight={headerRight} />
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
