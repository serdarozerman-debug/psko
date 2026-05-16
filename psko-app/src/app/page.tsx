
export default function Home() {
  const features = [
    {
      title: "Realistic client simulations",
      description:
        "Practice with AI-powered client personas built from cognitive models, emotional states, and therapeutic context.",
    },
    {
      title: "Multi-approach training",
      description:
        "Explore CBT, psychodynamic, humanistic, ACT, and DBT perspectives in a single learning environment.",
    },
    {
      title: "Competency-based feedback",
      description:
        "Review structured post-session feedback inspired by CTS-R domains to improve your clinical interviewing skills.",
    },
  ];

  const outcomes = [
    "Choose a persona and therapeutic approach",
    "Run a realistic text-based therapy simulation",
    "Get guided prompts without losing autonomy",
    "Review strengths, blind spots, and next steps",
  ];
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex max-w-6xl flex-col gap-16 px-6 py-12 sm:px-10 lg:px-12">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-400">
              PSKO
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Clinical psychology simulation trainer for students
            </p>
          </div>
          <div className="flex gap-3">
            <a
              className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition-colors hover:border-slate-500 hover:bg-slate-900"
              href="/login"
            >
              Sign in
            </a>
            <a
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
              href="/register"
            >
              Get started
            </a>
          </div>
        </header>

        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-8">
            <div className="space-y-5">
              <span className="inline-flex rounded-full border border-blue-800 bg-blue-950/60 px-3 py-1 text-xs font-medium text-blue-300">
                AI-guided deliberate practice
              </span>
              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Train clinical interviewing skills with realistic therapy simulations.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                PSKO helps psychology students practice with lifelike client personas,
                approach-specific guidance, and structured feedback designed to close
                the gap between theory and real clinical conversations.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
                href="/register"
              >
                Create an account
              </a>
              <a
                className="inline-flex items-center justify-center rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-500 hover:bg-slate-900"
                href="/login"
              >
                Open the simulator
              </a>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {outcomes.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-4 text-sm text-slate-300"
                >
                  <span className="mr-2 text-blue-400">•</span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-blue-950/20">
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Example session
                </p>
                <div className="mt-4 space-y-4 text-sm">
                  <div className="rounded-2xl rounded-bl-sm bg-slate-800 px-4 py-3 text-slate-100">
                    I&apos;ve been feeling low for months. I can&apos;t enjoy anything anymore,
                    and I&apos;m struggling to get out of bed.
                  </div>
                  <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-blue-600 px-4 py-3 text-white">
                    What feels hardest for you when you wake up and realize the day is
                    starting?
                  </div>
                  <div className="rounded-2xl rounded-bl-sm bg-slate-800 px-4 py-3 text-slate-100">
                    Mostly that nothing seems worth the effort. It feels like I&apos;m already
                    behind before I even begin.
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Guided support
                </p>
                <ul className="mt-4 space-y-3 text-sm text-slate-300">
                  <li>• Suggested questions aligned with the chosen approach</li>
                  <li>• Persona-specific realism through cognitive model prompting</li>
                  <li>• Feedback focused on empathy, pacing, collaboration, and discovery</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <section className="grid gap-5 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6"
            >
              <h2 className="text-lg font-semibold text-white">{feature.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                {feature.description}
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/50 p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold text-white">
                Built for psychology students who want more than peer role-play.
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
                Use PSKO to rehearse difficult conversations, compare therapeutic lenses,
                and build confidence before supervised clinical work.
              </p>
            </div>
            <div className="flex gap-3">
              <a
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
                href="/register"
              >
                Start practicing
              </a>
              <a
                className="inline-flex items-center justify-center rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-500 hover:bg-slate-900"
                href="/login"
              >
                Return to login
              </a>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
