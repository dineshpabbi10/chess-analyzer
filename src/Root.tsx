import { App } from './App'
import { PageShell } from './components/Nav'
import { AnalysisBoard } from './pages/AnalysisBoard'
import { BoardEditor } from './pages/BoardEditor'
import { EloCalculator } from './pages/EloCalculator'
import { NextMove } from './pages/NextMove'
import { Link, RouterProvider, useRoute } from './lib/router'

function NotFound() {
  return (
    <PageShell title="Page not found" subtitle="That link doesn't lead anywhere.">
      <div className="card">
        <Link to="/" className="primary btn-link">
          Back to Game Review
        </Link>
      </div>
    </PageShell>
  )
}

function Routes() {
  const path = useRoute()
  switch (path) {
    case '/':
      return <App />
    case '/tools/analysis':
      return <AnalysisBoard />
    case '/tools/next-move':
      return <NextMove />
    case '/tools/editor':
      return <BoardEditor />
    case '/tools/elo-calculator':
      return <EloCalculator />
    default:
      return <NotFound />
  }
}

export function Root() {
  return (
    <RouterProvider>
      <Routes />
    </RouterProvider>
  )
}
