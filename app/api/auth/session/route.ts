import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('access_token')?.value
    const userCookie = cookieStore.get('user')?.value

    if (!token || !userCookie) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      )
    }

    try {
      const user = JSON.parse(userCookie)
      
      return NextResponse.json({
        authenticated: true,
        token,
        user
      })
    } catch (error) {
      console.error('Error parsing user data:', error)
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Error getting session:', error)
    return NextResponse.json(
      { authenticated: false },
      { status: 500 }
    )
  }
}