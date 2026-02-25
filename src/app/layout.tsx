import { ThemeSync } from '@/components/theme/theme-sync'
import './globals.css'

export const metadata = {
  title: 'schema.notion',
  description: 'Diseña esquemas de bases de datos estilo Notion con IA',
}

const themeBootstrapScript = `
(() => {
  try {
    const root = document.documentElement;
    const raw = localStorage.getItem('config-storage');
    let isDark = null;

    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const state = parsed.state;
        if (state && typeof state === 'object' && typeof state.isDarkMode === 'boolean') {
          isDark = state.isDarkMode;
        }
      }
    }

    if (isDark === null) {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    root.classList.toggle('dark', isDark);
    root.dataset.theme = isDark ? 'dark' : 'light';
  } catch {
    // no-op
  }
})();
`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script>{themeBootstrapScript}</script>
      </head>
      <body className="min-h-screen antialiased">
        <ThemeSync />
        {children}
      </body>
    </html>
  )
}
