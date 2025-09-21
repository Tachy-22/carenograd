import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    const response = await fetch("http://localhost:3000/admin/health", {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      if (response.status === 403) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
      const errorText = await response.text()
      return NextResponse.json(
        { error: 'Failed to check admin health', details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Admin health API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}