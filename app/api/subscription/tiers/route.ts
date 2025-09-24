import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export async function GET() {
  try {
   // console.log('Fetching subscription tiers from backend...')

    // Forward the request to the backend
    const response = await fetch(`${API_BASE_URL}/subscription/tiers`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

   // console.log('Backend response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend error:', response.status, errorText)
      return NextResponse.json(
        { error: `Backend error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
   // console.log('Subscription tiers data from backend:', data)

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching subscription tiers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription tiers' },
      { status: 500 }
    )
  }
}