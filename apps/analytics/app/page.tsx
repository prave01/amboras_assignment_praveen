import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const cookieStore = await cookies()
  const hasToken = Boolean(cookieStore.get('access_token')?.value)

  if (hasToken) {
    redirect('/dashboard')
  }

  redirect('/login')
}
