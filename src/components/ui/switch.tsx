'use client'

import { cn } from '@/lib/utils'

type SwitchProps = {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
  id?: string
  'aria-label'?: string
}

export function Switch({
  checked,
  onCheckedChange,
  disabled = false,
  className,
  ...props
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-state={checked ? 'checked' : 'unchecked'}
      disabled={disabled}
      onClick={() => {
        if (!disabled) onCheckedChange(!checked)
      }}
      className={cn(
        'peer inline-flex h-6 w-10 shrink-0 items-center rounded-full border border-border transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 bg-primary/90',
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-xs transition-transform',
          checked ? 'translate-x-[18px]' : 'translate-x-1',
        )}
      />
    </button>
  )
}
