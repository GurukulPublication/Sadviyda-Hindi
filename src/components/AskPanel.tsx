/**
 * "Ask" — a chat about your translations, available on every page.
 *
 * It knows what the dashboard knows: your scores, and the flags of the article
 * you happen to be looking at. It needs an OpenAI key, saved in Settings; with
 * no key the button is not shown at all.
 */

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import { buildChatSystem, chat, hasKey, type ChatMessage } from '../lib/ai'
import { useApp } from '../context/AppContext'

/** Things worth asking, shown while the conversation is empty. */
const OPENERS = [
  'What do I keep getting wrong?',
  'Explain Meaning Drift with an example from my articles',
  'How do I keep my terms consistent?',
]

export default function AskPanel() {
  const { reports, allReports } = useApp()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Which article is on screen, if any — the chat answers about that one.
  const match = location.pathname.match(/\/articles\/(\d+)/)
  const current = match
    ? allReports.find((r) => String(r.id) === match[1])
    : undefined

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // No key, no button: the dashboard works without any of this.
  if (!hasKey()) return null

  async function send(text: string) {
    const question = text.trim()
    if (!question || busy) return
    const next: ChatMessage[] = [...messages, { role: 'user', content: question }]
    setMessages(next)
    setDraft('')
    setBusy(true)
    setError(null)
    try {
      const reply = await chat([
        buildChatSystem(reports, current),
        ...next.slice(-10), // keep the request small
      ])
      setMessages([...next, { role: 'assistant', content: reply }])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-primary fixed bottom-5 right-5 z-40 shadow-lift"
        aria-label="Ask about your translations"
      >
        ✨ Ask
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-stretch justify-end bg-ink/40"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Ask about your translations"
          >
            <div
              className="flex h-full w-full max-w-md flex-col border-l border-border bg-card"
              onClick={(e) => e.stopPropagation()}
            >
              <header className="flex items-center gap-3 border-b border-border p-4">
                <div className="min-w-0">
                  <h2 className="font-heading text-base font-semibold">Ask</h2>
                  <p className="truncate text-xs text-olive">
                    {current
                      ? `About “${current.title}”`
                      : `About your ${reports.length} article${reports.length === 1 ? '' : 's'}`}
                  </p>
                </div>
                <button
                  className="btn-ghost ml-auto px-3 py-1.5 text-xs"
                  onClick={() => setOpen(false)}
                >
                  Close
                </button>
              </header>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.length === 0 && (
                  <div className="space-y-2">
                    <p className="aside text-sm">
                      Ask anything about your translations. It can see your
                      scores and the flags on the article you are looking at.
                    </p>
                    {OPENERS.map((opener) => (
                      <button
                        key={opener}
                        onClick={() => send(opener)}
                        className="block w-full rounded-xl border border-border bg-cream/60 p-3 text-left text-sm hover:bg-sand"
                      >
                        {opener}
                      </button>
                    ))}
                  </div>
                )}

                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={
                      m.role === 'user'
                        ? 'ml-auto max-w-[85%] rounded-2xl bg-ink px-3.5 py-2.5 text-sm text-white'
                        : 'deva max-w-[92%] rounded-2xl border border-border bg-cream/70 px-3.5 py-2.5 text-[15px] leading-relaxed'
                    }
                  >
                    {m.content}
                  </div>
                ))}

                {busy && <p className="aside text-sm">Thinking…</p>}
                {error && (
                  <p className="rounded-xl border border-brand/30 bg-brand/5 p-3 text-sm">
                    {error}
                  </p>
                )}
                <div ref={endRef} />
              </div>

              <form
                className="flex items-center gap-2 border-t border-border p-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  send(draft)
                }}
              >
                <input
                  ref={inputRef}
                  className="input flex-1"
                  placeholder="Ask about a line, a term, a score…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button
                  type="submit"
                  className="btn-primary px-4 py-2 text-sm"
                  disabled={busy || !draft.trim()}
                >
                  Send
                </button>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
