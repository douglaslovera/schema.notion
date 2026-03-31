'use client'

function copyWithExecCommand(value: string) {
  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.top = '0'
  textarea.style.left = '0'
  textarea.style.opacity = '0'

  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()

  try {
    return document.execCommand('copy')
  } finally {
    document.body.removeChild(textarea)
  }
}

export async function copyToClipboard(value: string) {
  try {
    if (document.hasFocus() && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
      return true
    }
  } catch (error) {
    console.error('Clipboard API copy failed:', error)
  }

  try {
    return copyWithExecCommand(value)
  } catch (error) {
    console.error('Fallback copy failed:', error)
    return false
  }
}
