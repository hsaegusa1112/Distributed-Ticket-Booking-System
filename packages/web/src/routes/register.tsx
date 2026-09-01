import { createFileRoute } from '@tanstack/react-router'

import { AuthPage } from './auth-page'

export const Route = createFileRoute('/register')({ component: Register })

function Register() {
  return <AuthPage action="register" />
}