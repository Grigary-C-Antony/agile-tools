import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

const SYSTEM_PROMPT =
  'You are an Agile assistant. Convert a brief feature description into a user story.\n' +
  'Format: "As a [user type], I want [action] so that [benefit]."\n' +
  'Rules: one sentence, no markdown, no explanation, output ONLY the user story.'

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'OPENROUTER_API_KEY not set' }, { status: 500 })

  const body = await request.json().catch(() => null)
  if (!body?.description?.trim()) return NextResponse.json({ error: 'description required' }, { status: 400 })

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openrouter/free',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: body.description.trim() },
      ],
      reasoning: { enabled: true },
    }),
  })

  const result = await res.json()

  if (!res.ok) return NextResponse.json({ error: result?.error?.message ?? 'AI error' }, { status: res.status })

  const story = result.choices?.[0]?.message?.content?.trim() ?? ''
  if (!story) return NextResponse.json({ error: 'No response from AI' }, { status: 502 })

  return NextResponse.json({ story })
}
