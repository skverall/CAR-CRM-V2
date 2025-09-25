import { RegisterForm } from '@/components/auth/RegisterForm'
import { enableStaticRendering } from '@/lib/locale'

export default function RegisterPage() {
  enableStaticRendering()
  return <RegisterForm />
}
