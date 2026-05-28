import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SignInScreen } from './sign-in-screen'

export default async function SignInPage() {
  const user = await getCurrentUser()

  if (user) {
    redirect('/schemas')
  }

  return <SignInScreen />
}
