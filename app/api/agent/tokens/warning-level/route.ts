import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export async function GET(request: NextRequest) {
  try {
    // Extract the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    console.log('Proxying warning-level request to backend...')

    // Forward the request to the backend
    const response = await fetch(`${API_BASE_URL}/agent/tokens/warning-level`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    })

    console.log('Backend response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend error:', response.status, errorText)
      return NextResponse.json(
        { error: `Backend error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Warning level data from backend:', data)

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching warning level:', error)
    return NextResponse.json(
      { error: 'Failed to fetch warning level' },
      { status: 500 }
    )
  }
}