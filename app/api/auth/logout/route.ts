import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const response = NextResponse.json({ 
      success: true, 
      message: 'Logged out successfully' 
    })

    // Clear cookies by setting them with expired dates
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      expires: new Date(0), // Set expiration to past date
    }

    response.cookies.set('access_token', '', cookieOptions)
    response.cookies.set('user', '', cookieOptions)

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    )
  }
}