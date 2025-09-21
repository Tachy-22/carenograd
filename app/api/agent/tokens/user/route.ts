import { NextRequest, NextResponse } from 'next/server'

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

    console.log('Proxying user token usage request to backend...')
    
    // Forward the request to the backend
    const response = await fetch('http://localhost:3000/agent/tokens/user', {
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
    console.log('User token data from backend:', data)

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching user token data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user token data' },
      { status: 500 }
    )
  }
}