import { NextResponse } from 'next/server'

const MONDAY_API_URL = 'https://api.monday.com/v2'

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

    const token = process.env.MONDAY_API_TOKEN
    const boardId = process.env.MONDAY_RESOURCES_BOARD_ID

    if (!token) {
      return NextResponse.json(
        { error: 'Missing MONDAY_API_TOKEN in environment variables.' },
        { status: 500 }
      )
    }

    if (!boardId) {
      return NextResponse.json(
        { error: 'Missing MONDAY_RESOURCES_BOARD_ID in environment variables.' },
        { status: 500 }
      )
    }

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
                value
              }
            }
          }
        }
      }
    `

    const variables = {
      boardId: [boardId],
    }

    const mondayRes = await fetch(MONDAY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
        'API-Version': '2026-01',
      },
      body: JSON.stringify({ query, variables }),
      cache: 'no-store',
    })

    const result = await mondayRes.json()

    if (!mondayRes.ok || result.errors) {
      return NextResponse.json(
        {
          error: 'Monday API request failed',
          details: result.errors || result,
        },
        { status: 500 }
      )
    }

    const items = result.data?.boards?.[0]?.items_page?.items || []
    const lowerPrompt = (prompt || '').toLowerCase().trim()

    const mapped = items.map((item: any) => {
      const columnValues = item.column_values || []

      const getColumnByLikelyId = (possibleIds: string[]) => {
        return columnValues.find((col: any) => possibleIds.includes(col.id))
      }

      const getColumnTextByLikelyId = (possibleIds: string[]) => {
        const col = getColumnByLikelyId(possibleIds)
        return col?.text || ''
      }

      // These are guesses based on common Monday IDs.
      // The debug block below will tell us the real IDs if needed.
      const dateText = getColumnTextByLikelyId(['date', 'date4', 'date_mksra1t'])
      const filesText = getColumnTextByLikelyId(['files', 'file', 'assets'])
      const linkText = getColumnTextByLikelyId(['link', 'url', 'website'])

      // Search across ALL column text too, so even if IDs are off,
      // Harper still has a better chance of finding the right item.
      const allColumnText = columnValues
        .map((col: any) => col.text)
        .filter(Boolean)
        .join(' ')

      const summaryParts = [dateText, filesText].filter(Boolean)

      return {
        id: Number(item.id),
        title: item.name,
        category: '',
        summary: summaryParts.join(' • '),
        link: linkText || '',
        tags: '',
        searchableText: [item.name, allColumnText].filter(Boolean).join(' ').toLowerCase(),
      }
    })

    const filtered = lowerPrompt
      ? mapped.filter((item: any) => item.searchableText.includes(lowerPrompt))
      : mapped

    return NextResponse.json({
      source: 'monday',
      results: filtered.slice(0, 8),
      debug: {
        totalItems: items.length,
        firstItemColumnIds:
          items[0]?.column_values?.map((c: any) => ({
            id: c.id,
            text: c.text,
            type: c.type,
          })) || [],
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Server error',
        details: String(error),
      },
      { status: 500 }
    )
  }
}