import { SharedCanvasView } from '@/components/share/shared-canvas-view'
import { getSharedThreadByToken } from '@/lib/thread'
import { notFound } from 'next/navigation'

type PageProps = {
  params: Promise<{ token: string }>
}

export default async function EmbeddedCanvasPage({ params }: PageProps) {
  const { token } = await params
  const thread = await getSharedThreadByToken(token)

  if (!thread?.diagram) {
    notFound()
  }

  return <SharedCanvasView diagram={thread.diagram} />
}
