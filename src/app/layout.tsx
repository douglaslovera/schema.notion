import { ThemeScript } from '@/components/theme/theme-script'
import { ThemeSync } from '@/components/theme/theme-sync'
import './globals.css'

export const metadata = {
  title: 'schema.notion',
  description: 'Diseña esquemas de bases de datos estilo Notion con IA',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-screen antialiased">
        <ThemeSync />
        {children}
      </body>
    </html>
  )
}
