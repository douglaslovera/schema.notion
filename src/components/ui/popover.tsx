'use client'

import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'
import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { MouseEvent as ReactMouseEvent, ReactNode, RefObject } from 'react'

type PopoverContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: RefObject<HTMLElement | null>
  contentRef: RefObject<HTMLDivElement | null>
  contentId: string
}

const PopoverContext = createContext<PopoverContextValue | null>(null)

function usePopoverContext() {
  const ctx = useContext(PopoverContext)
  if (!ctx) {
    throw new Error('Popover components must be used within <Popover>')
  }
  return ctx
}

export function Popover({
  children,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
}: {
  children: ReactNode
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const triggerRef = useRef<HTMLElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const contentId = useId()
  const open = controlledOpen ?? uncontrolledOpen

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (controlledOpen === undefined) {
        setUncontrolledOpen(nextOpen)
      }
      onOpenChange?.(nextOpen)
    },
    [controlledOpen, onOpenChange],
  )

  const value = useMemo(
    () => ({
      open,
      setOpen,
      triggerRef,
      contentRef,
      contentId,
    }),
    [open, setOpen, contentId],
  )

  return (
    <PopoverContext.Provider value={value}>
      <div className="relative inline-flex">{children}</div>
    </PopoverContext.Provider>
  )
}

export function PopoverTrigger({
  children,
  asChild = false,
  className,
}: {
  children: ReactNode
  asChild?: boolean
  className?: string
}) {
  const { open, setOpen, triggerRef, contentId } = usePopoverContext()
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      {...(!asChild ? { type: 'button' } : {})}
      ref={(node: HTMLElement | null) => {
        triggerRef.current = node
      }}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls={contentId}
      data-state={open ? 'open' : 'closed'}
      onClick={(event: ReactMouseEvent<HTMLElement>) => {
        if (event.defaultPrevented) return
        setOpen(!open)
      }}
      className={className}
    >
      {children}
    </Comp>
  )
}

export function PopoverContent({
  children,
  className,
  align = 'end',
  sideOffset = 8,
}: {
  children: ReactNode
  className?: string
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
}) {
  const { open, setOpen, triggerRef, contentRef, contentId } = usePopoverContext()

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (contentRef.current?.contains(target)) return
      if (triggerRef.current?.contains(target)) return
      setOpen(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, setOpen, contentRef, triggerRef])

  if (!open) return null

  return (
    <div
      ref={contentRef}
      id={contentId}
      data-state={open ? 'open' : 'closed'}
      style={{ marginTop: sideOffset }}
      className={cn(
        'absolute top-full z-[100] min-w-56 rounded-2xl border border-border/80 bg-card p-1 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.25)]',
        align === 'start' && 'left-0',
        align === 'center' && 'left-1/2 -translate-x-1/2',
        align === 'end' && 'right-0',
        className,
      )}
    >
      {children}
    </div>
  )
}
