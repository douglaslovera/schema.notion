// Runs before first paint so the `dark` class is on <html> when the browser
// paints. Must stay in sync with the persist key and shape of `useConfigStore`.
const script = `(() => {
  try {
    const stored = localStorage.getItem('config-storage')
    const persisted = stored ? JSON.parse(stored).state.isDarkMode : undefined
    const isDark =
      typeof persisted === 'boolean'
        ? persisted
        : matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.classList.toggle('dark', isDark)
  } catch {}
})()`

export function ThemeScript() {
  // biome-ignore lint/security/noDangerouslySetInnerHtml: static, non-user-supplied script
  return <script dangerouslySetInnerHTML={{ __html: script }} />
}
