import { PATHS } from '@/constants/paths'
import { redirect } from 'next/navigation'

export default function SchemasRedirect() {
  redirect(PATHS.NEW_CHAT)
}
