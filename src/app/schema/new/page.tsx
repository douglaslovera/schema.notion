import { PATHS } from '@/constants/paths'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function NewSchemaPage() {
  redirect(`${PATHS.CHAT}/${crypto.randomUUID()}`)
}
