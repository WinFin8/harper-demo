'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const tips = [
  "Organizer Insight: Start With Three. Not Thirty. Movements don’t begin with momentum. They begin with three people in a living room who care. Your challenge: Call three people this week. That’s it. Start small then build strong.",
  "Organizer Insight: Always capture stories. Data tells you what happened, stories tell you why it mattered.",
  "Organizer Insight: When organizing an event, the follow-up matters more than the invite. Follow the 48 hour rule.",
  "Organizer Insight: If members are confused, simplify the process before writing more instructions.",
  "Organizer Insight: People stay in movements because of relationships, not dashboards.",
  "Organizer Insight: Track what works, but never lose the human connection behind the metrics.",
  "Organizer Insight: Local Stories Beat National Noise. Cable news might set the mood, but school boards set policy. Your community story carries more persuasive weight than a viral headline. Your challenge: Tie every national issue back to one real local example.",
  "Organizer Insight: Assume Good Faith Until It’s Proven Otherwise. You will meet confused people. You will meet misinformed people. Most are not villains, they’re overwhelmed. Your challenge: Start conversations with curiosity before correction.",
]

type Resource = {
  id: number
  title: string
  category: string | null
  summary: string | null
  link?: string | null
  tags?: string | null
}

type Person = {
  id: number
  first_name: string
  last_name: string
  city: string | null
  county: string | null
  state: string | null
  issue_interest: string | null
  event_count_12mo: number | null
  leadership_score: number | null
  host_potential: boolean | null
}

export default function Home() {
  const [prompt, setPrompt] = useState('')
  const [resources, setResources] = useState<Resource[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [mode, setMode] = useState<'resources' | 'people' | null>(null)
  const [thinking, setThinking] = useState(false)
  const [tipOfTheDay, setTipOfTheDay] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const randomTip = tips[Math.floor(Math.random() * tips.length)]
    setTipOfTheDay(randomTip)
  }, [])

  const detectMode = (text: string) => {
    const lower = text.toLowerCase()

    if (
      lower.includes('members') ||
      lower.includes('people') ||
      lower.includes('volunteers') ||
      lower.includes('attended')
    ) {
      return 'people'
    }

    return 'resources'
  }

  const search = async () => {
    setThinking(true)
    setErrorMessage('')
    setResources([])
    setPeople([])

    const detected = detectMode(prompt)
    setMode(detected)

    await new Promise((r) => setTimeout(r, 500))

    try {
      if (detected === 'resources') {
        const res = await fetch('/api/harper-search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt }),
        })

        const json = await res.json()

        if (!res.ok) {
          console.error('Monday route failed:', json)
          setErrorMessage('I had trouble reaching the monday.com resources board.')
        } else {
          setResources(json.results || [])
        }
      }

      if (detected === 'people') {
        let query = supabase.from('people').select('*').limit(10)

        const lowerPrompt = prompt.toLowerCase()

        if (lowerPrompt.includes('richmond')) {
          query = query.ilike('city', '%Richmond%')
        }

        if (lowerPrompt.includes('loudoun')) {
          query = query.ilike('county', '%Loudoun%')
        }

        if (
          lowerPrompt.includes('education') ||
          lowerPrompt.includes('school') ||
          lowerPrompt.includes('school boards')
        ) {
          query = query.ilike('issue_interest', '%education%')
        }

        const { data, error } = await query

        if (error) {
          console.error('Supabase people query failed:', error)
          setErrorMessage('I had trouble searching people records.')
        } else if (data) {
          setPeople(data)
        }
      }
    } catch (error) {
      console.error('Search failed:', error)
      setErrorMessage('Something went wrong while searching.')
    } finally {
      setThinking(false)
    }
  }

  return (
    <main className="min-h-screen bg-white text-slate-900 p-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 space-y-3">
            <p className="text-2xl font-bold">Hi, [[dynamic name]]</p>
            <p className="text-sm text-slate-500 italic">How can I help?</p>

            {tipOfTheDay && (
              <div className="mt-4 p-3 rounded-lg bg-gray-100 border text-sm text-gray-700 max-w-2xl">
                💡 {tipOfTheDay}
              </div>
            )}
          </div>

          <img
            src="/harper_icon.png"
            alt="Harper organizing assistant"
            className="w-24 h-24 rounded-xl shadow"
          />
        </div>

        <div className="text-sm text-slate-500">
          Try asking:
          <br />
          • where is the SOP for requesting a new monday board?
          <br />
          • find members near Richmond interested in education
          <br />
          • find volunteers in Loudoun interested in school boards
        </div>

        <textarea
          className="w-full border rounded-lg p-4"
          rows={4}
          placeholder="Where do I find..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <button
          onClick={search}
          className="px-5 py-2 bg-[#341c59] text-white rounded hover:opacity-90 transition"
        >
          Ask Harper
        </button>

        {thinking && (
          <div className="text-sm text-slate-500 italic">
            Harper is reviewing member activity and internal resources...
          </div>
        )}

        {errorMessage && (
          <div className="text-sm text-red-600 border-l-4 border-red-400 pl-3">
            {errorMessage}
          </div>
        )}

        {mode && !thinking && !errorMessage && (
          <div className="text-sm text-slate-600 border-l-4 border-slate-400 pl-3">
            Harper found the following based on your request.
          </div>
        )}

        {mode === 'resources' && resources.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Resources</h2>

            {resources.map((r) => (
              <div key={r.id} className="border rounded-lg p-4">
                <h3 className="font-semibold">{r.title}</h3>

                {r.category && (
                  <p className="text-sm text-gray-500">{r.category}</p>
                )}

                {r.summary && <p className="mt-2">{r.summary}</p>}

                {r.tags && (
                  <p className="mt-2 text-sm text-slate-500">
                    Tags: {r.tags}
                  </p>
                )}

                {r.link && (
                  <a
                    href={r.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-3 text-sm text-[#341c59] underline"
                  >
                    Open resource
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {mode === 'resources' && !thinking && resources.length === 0 && !errorMessage && (
          <div className="text-sm text-slate-500 italic">
            No matching resources found.
          </div>
        )}

        {mode === 'people' && people.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">People</h2>

            <div className="bg-slate-50 border rounded-lg p-3 text-sm text-slate-600">
              <strong>Why these matched:</strong>
              <ul className="list-disc ml-5 mt-1">
                {prompt.toLowerCase().includes('richmond') && (
                  <li>Located in Richmond area</li>
                )}
                {prompt.toLowerCase().includes('loudoun') && (
                  <li>Located in Loudoun area</li>
                )}
                {(prompt.toLowerCase().includes('education') ||
                  prompt.toLowerCase().includes('school')) && (
                  <li>Interest in education issues</li>
                )}
                <li>Recent event participation</li>
              </ul>
            </div>

            {people.map((p) => (
              <div key={p.id} className="border rounded-lg p-4">
                <h3 className="font-semibold">
                  {p.first_name} {p.last_name}
                </h3>

                <p className="text-sm text-gray-500">
                  {[p.city, p.state].filter(Boolean).join(', ')}
                </p>

                {p.issue_interest && (
                  <p className="mt-2">Issue: {p.issue_interest}</p>
                )}

                <p>Events attended: {p.event_count_12mo ?? 0}</p>

                <p>Leadership score: {p.leadership_score ?? 'N/A'}</p>

                {p.host_potential && (
                  <p className="text-green-600 font-medium mt-1">
                    Potential event host
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {mode === 'people' && !thinking && people.length === 0 && !errorMessage && (
          <div className="text-sm text-slate-500 italic">
            No matching people found.
          </div>
        )}
      </div>
    </main>
  )
}