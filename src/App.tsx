/** App shell: top navigation, routes, and the settings drawer. */

import { useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import SettingsDrawer from './components/SettingsDrawer'
import Home from './pages/Home'
import Articles from './pages/Articles'
import ArticleDetail from './pages/ArticleDetail'
import AddReport from './pages/AddReport'

function Nav({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { languageFilter } = useApp()
  const link = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-full text-sm font-heading transition-colors ${
      isActive ? 'bg-sand text-ink' : 'text-ink/70 hover:text-ink hover:bg-sand/60'
    }`

  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-cream/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:px-6">
        <NavLink to="/" className="mr-auto flex items-center gap-2">
          <span className="text-xl" aria-hidden>
            🪔
          </span>
          {/* The name is hidden on small screens so the bar never wraps. */}
          <span className="hidden font-heading text-sm font-semibold leading-tight sm:inline sm:text-base">
            Sadvidya <span className="text-terracotta">Scorecard</span>
          </span>
        </NavLink>

        <NavLink to="/" end className={link}>
          Home
        </NavLink>
        <NavLink to="/articles" className={link}>
          Articles
        </NavLink>
        <NavLink to="/add" className="btn-primary whitespace-nowrap">
          {/* The button is a flex row with a gap, so no space is needed here. */}
          + Add<span className="hidden sm:inline">Report</span>
        </NavLink>
        <button
          onClick={onOpenSettings}
          className="ml-1 rounded-full border border-ink/15 px-3 py-2 text-sm hover:bg-sand"
          aria-label="Settings"
          title={`Settings — language filter: ${languageFilter}`}
        >
          ⚙
        </button>
      </nav>
    </header>
  )
}

function Shell() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  return (
    <div className="min-h-screen">
      <Nav onOpenSettings={() => setSettingsOpen(true)} />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/articles" element={<Articles />} />
          <Route path="/articles/:id" element={<ArticleDetail />} />
          <Route path="/add" element={<AddReport />} />
        </Routes>
      </main>
      <footer className="mx-auto max-w-6xl px-4 pb-10 text-center text-xs text-ink/40 sm:px-6">
        Sadvidya Magazine · Shree Swaminarayan Gurukul, Rajkot — your data stays
        in this browser.
      </footer>
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
