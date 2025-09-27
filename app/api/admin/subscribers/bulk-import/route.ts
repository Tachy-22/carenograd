import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { subscribers } = body

    if (!Array.isArray(subscribers) || subscribers.length === 0) {
      return NextResponse.json(
        { error: 'Subscribers array is required and cannot be empty' },
        { status: 400 }
      )
    }

    const response = await fetch(`${API_BASE_URL}/admin/subscribers/bulk-import`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend error:', response.status, errorText)
      return NextResponse.json(
        { error: `Backend error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error bulk importing subscribers:', error)
    return NextResponse.json(
      { error: 'Failed to bulk import subscribers' },
      { status: 500 }
    )
  }
}