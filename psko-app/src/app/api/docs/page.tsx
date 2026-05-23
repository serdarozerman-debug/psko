import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * /api/docs — Swagger UI for the PSKO API.
 *
 * Auth-gated: requires a Supabase session. Bundles Swagger UI via CDN
 * to avoid pulling swagger-ui-dist into the application bundle.
 */
export default async function ApiDocsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/sign-in?next=/api/docs')
  }

  return (
    <html lang="tr">
      <head>
        <title>PSKO API Docs</title>
        <link
          rel="stylesheet"
          href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"
        />
      </head>
      <body>
        <div id="swagger-ui" />
        <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" defer />
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('load', function () {
                window.ui = SwaggerUIBundle({
                  url: '/openapi.json',
                  dom_id: '#swagger-ui',
                  deepLinking: true,
                })
              })
            `,
          }}
        />
      </body>
    </html>
  )
}
