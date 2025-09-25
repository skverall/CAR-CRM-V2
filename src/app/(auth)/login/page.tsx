import { LoginForm } from '@/components/auth/LoginForm'
import { enableStaticRendering } from '@/lib/locale'

export default function LoginPage() {
  enableStaticRendering()
  return <LoginForm />
}
