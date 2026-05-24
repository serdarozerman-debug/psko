import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db/prisma'

const NAV_ITEMS = [
  { href: '/educator/cohorts', label: 'Cohorts' },
  { href: '/educator/assignments', label: 'Assignments' },
  { href: '/educator/reports', label: 'Reports' },
  { href: '/educator/personas', label: 'Personas' },
]

export default async function EducatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, role: true },
  })

  if (!dbUser || dbUser.role !== 'EDUCATOR') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      <aside className="w-60 border-r border-slate-800 flex flex-col">
        <div className="px-6 py-5 border-b border-slate-800">
          <Link href="/educator/cohorts" className="text-xl font-bold">
            PSKO
          </Link>
          <p className="text-xs text-slate-500 mt-0.5">Educator</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 text-sm text-slate-300 rounded-md hover:bg-slate-900 hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-slate-800">
          <div className="text-xs text-slate-500 truncate" title={dbUser.email}>
            {dbUser.email}
          </div>
          <form action="/api/auth/signout" method="post" className="mt-2">
            <button
              type="submit"
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-10">{children}</div>
      </main>
    </div>
  )
}
