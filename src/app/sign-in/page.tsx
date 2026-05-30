import { isUserAllowlisted } from '@/lib/access-allowlist'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SignInScreen } from './sign-in-screen'

export default async function SignInPage() {
  const user = await getCurrentUser()

  if (user) {
    const isAllowlisted = await isUserAllowlisted(user)

    if (!isAllowlisted) {
      redirect('/#waitlist')
    }

    redirect('/schemas')
  }

  return <SignInScreen />
}
