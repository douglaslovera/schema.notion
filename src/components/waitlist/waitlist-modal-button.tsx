'use client'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { ArrowRight, X } from '@/components/ui/icons'
import { useState } from 'react'

type WaitlistModalButtonProps = {
  label?: string
  className?: string
}

const WAITLIST_EMBED_URL =
  'https://synapse-labs.notion.site/ebd//354dcbbde6728081be85d9014448708e'

export function WaitlistModalButton({
  label = 'Join the Waitlist',
  className,
}: WaitlistModalButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button className={className} size="lg" type="button">
          {label}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="h-[100dvh] max-h-[100dvh] w-full max-w-none gap-0 overflow-hidden rounded-none border-0 p-0 shadow-none sm:h-[92dvh] sm:max-h-[92dvh] sm:w-[94vw] sm:max-w-[94vw] sm:rounded-2xl sm:border sm:border-border/80">
        <div className="flex min-h-0 flex-1 flex-col bg-background">
          <div className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border/80 px-4 sm:px-5">
            <div>
              <AlertDialogTitle className="text-sm font-medium tracking-tight">
                Join the Waitlist
              </AlertDialogTitle>
              <AlertDialogDescription className="sr-only">
                Embedded waitlist form hosted in Notion.
              </AlertDialogDescription>
            </div>
            <AlertDialogCancel className="h-9 w-9 rounded-md p-0">
              <X className="h-4 w-4" />
              <span className="sr-only">Close waitlist modal</span>
            </AlertDialogCancel>
          </div>
          <iframe
            title="schema.notion waitlist"
            src={WAITLIST_EMBED_URL}
            width="100%"
            height="600"
            className="min-h-0 flex-1 border-0"
            allowFullScreen
          />
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
