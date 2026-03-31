import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LBaraka — Plateforme Solidaire de Prêt et Partage',
  description: 'Présentation du projet LBaraka : une application mobile solidaire pour le prêt, le don et la location entre particuliers au Maroc.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased bg-white">
        {children}
      </body>
    </html>
  )
}
