import Link from 'next/link'
import { WizardShell } from '@/components/educator/persona-wizard/WizardShell'

export const dynamic = 'force-dynamic'

export default function NewPersonaPage() {
  return (
    <div className="space-y-6">
      <div className="text-sm">
        <Link
          href="/educator/personas"
          className="text-slate-400 hover:text-white transition-colors"
        >
          ← Personas
        </Link>
      </div>

      <header>
        <h1 className="text-2xl font-bold">New Persona</h1>
        <p className="text-slate-400 text-sm mt-1">
          Build a custom client persona for your assignments.
        </p>
      </header>

      <WizardShell />
    </div>
  )
}
