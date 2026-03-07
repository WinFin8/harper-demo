import { NextResponse } from 'next/server'

const MONDAY_API_URL = 'https://api.monday.com/v2'

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

    const query = `
      query GetBoardItems($boardId: [ID!]) {
        boards(ids: $boardId) {
          name
          items_page(limit: 25) {
            items {
              id
              name
              column_values {
                id
                text
                type
              }
            }
          }
        }
      }
    `

    const variables = {
      boardId: [process.env.MONDAY_RESOURCES_BOARD_ID]
    }

    const mondayRes = await fetch(MONDAY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': process.env.MONDAY_API_TOKEN || '',
        'API-Version': '2026-01'
      },
      body: JSON.stringify({ query, variables }),
      cache: 'no-store'
    })

    const result = await mondayRes.json()

    if (!mondayRes.ok || result.errors) {
      return NextResponse.json(
        { error: 'Monday API request failed', details: result.errors || result },
        { status: 500 }
      )
    }

    const items = result.data?.boards?.[0]?.items_page?.items || []

    const lowerPrompt = (prompt || '').toLowerCase()

    const mapped = items.map((item: any) => {
      const cols = Object.fromEntries(
        (item.column_values || []).map((c: any) => [c.id, c.text])
      )

      return {
        id: item.id,
        title: item.name,
        category: cols.category || '',
        summary: cols.summary || '',
        link: cols.link || '',
        tags: cols.tags || '',
        searchableText: [
          item.name,
          cols.category,
          cols.summary,
          cols.tags
        ]
          .join(' ')
          .toLowerCase()
      }
    })

    const filtered = mapped
      .filter((item: any) => item.searchableText.includes(lowerPrompt))
      .slice(0, 8)

    return NextResponse.json({
      results: filtered.length ? filtered : mapped.slice(0, 8)
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Server error', details: String(error) },
      { status: 500 }
    )
  }
}