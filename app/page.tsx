'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type Resource = {
  id: number
  title: string
  category: string | null
  summary: string | null
  content: string | null
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

    setResources([])
    setPeople([])

    const detected = detectMode(prompt)
    setMode(detected)

    await new Promise((r) => setTimeout(r, 700))

    if (detected === 'resources') {
      const { data } = await supabase
        .from('resources')
        .select('*')
        .limit(5)

      if (data) setResources(data)
    }

    if (detected === 'people') {
      let query = supabase.from('people').select('*').limit(10)

      if (prompt.toLowerCase().includes('richmond')) {
        query = query.ilike('city', '%Richmond%')
      }

      if (
        prompt.toLowerCase().includes('education') ||
        prompt.toLowerCase().includes('school')
      ) {
        query = query.ilike('issue_interest', '%education%')
      }

      const { data } = await query

      if (data) setPeople(data)
    }

    setThinking(false)
  }

  return (
    <main className="min-h-screen bg-white text-slate-900 p-10">
      <div className="max-w-4xl mx-auto space-y-6">

        <h1 className="text-4xl font-bold">
          Harper
        </h1>

        <p className="text-gray-500">
          Your internal organizing copilot
        </p>

        <div className="text-sm text-slate-500">
          Try asking:
          <br />
          • find members near Richmond interested in education
          <br />
          • find volunteers in Loudoun interested in school boards
          <br />
          • where is the SOP for requesting a new monday board
        </div>

        <textarea
          className="w-full border rounded-lg p-4"
          rows={4}
          placeholder="Ask Harper where an SOP lives, or find members near Richmond interested in education..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <button
          onClick={search}
          className="px-5 py-2 bg-black text-white rounded"
        >
          Ask Harper
        </button>

        {thinking && (
          <div className="text-sm text-slate-500 italic">
            Harper is reviewing member activity and internal resources...
          </div>
        )}

        {mode && !thinking && (
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
                <p className="text-sm text-gray-500">{r.category}</p>
                <p className="mt-2">{r.summary}</p>
              </div>
            ))}
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
                  {p.city}, {p.state}
                </p>

                <p className="mt-2">
                  Issue: {p.issue_interest}
                </p>

                <p>
                  Events attended: {p.event_count_12mo}
                </p>

                <p>
                  Leadership score: {p.leadership_score}
                </p>

                {p.host_potential && (
                  <p className="text-green-600 font-medium mt-1">
                    Potential event host
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  )
}