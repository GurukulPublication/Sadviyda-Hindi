/** App shell: the Gurukul header, the routes, the footer band and settings. */

import { useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import SettingsDrawer from './components/SettingsDrawer'
import Home from './pages/Home'
import Articles from './pages/Articles'
import ArticleDetail from './pages/ArticleDetail'
import AddReport from './pages/AddReport'

function Header({ onOpenSettings }: { onOpenSettings: () => void }) {
  const link = ({ isActive }: { isActive: boolean }) =>
    `relative font-heading text-sm font-medium transition-colors ${
      isActive
        ? 'text-brand after:absolute after:-bottom-1.5 after:left-0 after:h-[2px] after:w-full after:bg-brand'
        : 'text-ink/80 hover:text-ink'
    }`

  return (
    <header className="border-b border-border/70">
      <nav className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        {/* Emblem + wordmark, as in the printed magazine masthead. */}
        <NavLink to="/" className="mr-auto flex items-center gap-3 sm:gap-4">
          <img
            src="./gurukul-emblem.png"
            alt="Shree Swaminarayan Gurukul emblem"
            className="h-9 w-auto sm:h-10"
          />
          <span className="hidden h-8 w-px bg-border sm:block" />
          <img
            src="./sadvidya-wordmark.png"
            alt="Sadvidya"
            className="hidden h-5 w-auto sm:block"
          />
        </NavLink>

        <NavLink to="/" end className={link}>
          Home
        </NavLink>
        <NavLink to="/articles" className={link}>
          Articles
        </NavLink>
        <NavLink to="/add" className="btn-primary whitespace-nowrap px-4 py-2">
          + Add<span className="hidden sm:inline">Report</span>
        </NavLink>
        <button
          onClick={onOpenSettings}
          className="rounded-full border border-border px-3 py-2 text-sm text-olive hover:bg-sand"
          aria-label="Settings"
        >
          ⚙
        </button>
      </nav>
    </header>
  )
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-footer">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-6 text-center sm:flex-row sm:px-6 sm:text-left">
        <img
          src="./gurukul-emblem.png"
          alt=""
          className="h-8 w-auto"
          aria-hidden
        />
        <span className="font-heading text-sm font-medium text-ink">
          Shree Swaminarayan Gurukul · Rajkot Sansthan
        </span>
        <span className="aside text-sm sm:ml-auto">
          Sadvidya Translation Scorecard
        </span>
      </div>
    </footer>
  )
}

function Shell() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  return (
    <div className="flex min-h-screen flex-col">
      <Header onOpenSettings={() => setSettingsOpen(true)} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/articles" element={<Articles />} />
          <Route path="/articles/:id" element={<ArticleDetail />} />
          <Route path="/add" element={<AddReport />} />
        </Routes>
      </main>
      <Footer />
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
