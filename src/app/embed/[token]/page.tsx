import { SharedCanvasView } from '@/components/share/shared-canvas-view'
import { getSharedThreadByToken } from '@/lib/thread'
import { shareTokenSchema } from '@/lib/thread-validation'
import { notFound } from 'next/navigation'

type PageProps = {
  params: Promise<{ token: string }>
}

export default async function EmbeddedCanvasPage({ params }: PageProps) {
  const { token } = await params
  const tokenResult = shareTokenSchema.safeParse(token)

  if (!tokenResult.success) {
    notFound()
  }

  const thread = await getSharedThreadByToken(tokenResult.data)

  if (!thread?.diagram) {
    notFound()
  }

  return <SharedCanvasView diagram={thread.diagram} />
}
