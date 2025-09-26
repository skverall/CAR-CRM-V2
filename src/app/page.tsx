import { redirect } from 'next/navigation'

export default function Home() {
  // Server-side redirect to login to avoid client-side loading spinner loops
  redirect('/login')
}
