import { Link, createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

function DefaultNotFoundComponent() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f1e8] p-5 text-[#17211c]">
      <div className="border border-[#17211c]/20 bg-[#e7e3d7] p-8 text-center sm:p-12">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a84a32]">404</p>
        <h1 className="mt-3 font-serif text-4xl font-bold">That page is not here.</h1>
        <Link className="mt-8 inline-block bg-[#17211c] px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-[#f4f1e8] hover:bg-[#a84a32]" to="/">
          Back to tickets
        </Link>
      </div>
    </main>
  )
}

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultNotFoundComponent: DefaultNotFoundComponent,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
