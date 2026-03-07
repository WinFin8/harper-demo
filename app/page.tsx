'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const tips = [
  "Organizer Insight: Start With Three. Not Thirty.Movements don’t begin with momentum. They begin with three people in a living room who care. Your challenge: Call three people this week. That’s it. Start small. Build strong.",
  "Organizer Insight: Always capture stories. Data tells you what happened, stories tell you why it mattered.",
  "Organizer Insight: When organizing an event, the follow-up matters more than the invite. Follow the 48 hour rule",
  "Organizer Insight: If members are confused, simplify the process before writing more instructions.",
  "Organizer Insight: People stay in movements because of relationships, not dashboards.",
  "Organizer Insight: Track what works, but never lose the human connection behind the metrics.",
  "Organizer Insight: Local Stories Beat National Noise. Cable news might set the mood, but school boards set policy. Your community story carries more persuasive weight than a viral headline. <b>Your challenge</b>: Tie every national issue back to one real local example. ",
  "Organizer Insight: Assume Good Faith Until It’s Proven Otherwise. You will meet confused people. You will meet misinformed people. Most are not villains, they’re overwhelmed. <b>Your challenge</b>: Start conversations with curiosity before correction. ",
]

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

const tipOfTheDay = tips[Math.floor(Math.random() * tips.length)]

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
        <div className="flex items-center gap-6">
          <div>
              <div className="mt-4 p-3 rounded-lg bg-gray-100 border text-sm text-gray-700 max-w-xl">
              💡 {tipOfTheDay}
              <br />
               <br />
            </div>
            <p className="text-2xl font-bold">Hi, [[dynamic name]]</p>
            <p className="text-sm text-slate-500 mt-1 italic">How can I help?</p>

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
          • find members near Richmond interested in education?
          <br />
          • find volunteers in Loudoun interested in school boards?
          <br />
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