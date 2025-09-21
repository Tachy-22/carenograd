import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { token, user } = await request.json()

    if (!token || !user) {
      return NextResponse.json(
        { error: 'Token and user data required' },
        { status: 400 }
      )
    }

    const response = NextResponse.json({ success: true })

    const isProduction = process.env.NODE_ENV === 'production'
    const cookieOptions = {
      httpOnly: true, // Secure - can't be accessed by JavaScript
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    }

    // Set cookies on the response
    response.cookies.set('access_token', token, cookieOptions)
    response.cookies.set('user', JSON.stringify(user), cookieOptions)

    return response
  } catch (error) {
    console.error('Error setting auth cookies:', error)
    return NextResponse.json(
      { error: 'Failed to set cookies' },
      { status: 500 }
    )
  }
}