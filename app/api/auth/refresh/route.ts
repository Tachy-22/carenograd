import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const currentToken = cookieStore.get('access_token')?.value
    const userCookie = cookieStore.get('user')?.value

    if (!currentToken || !userCookie) {
      return NextResponse.json(
        { error: 'No existing session found' },
        { status: 401 }
      )
    }

    // Try to refresh the token with the backend
    const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh-jwt-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`,
      },
    })

    if (!refreshResponse.ok) {
      console.error('Backend token refresh failed:', refreshResponse.status)
      
      // If backend refresh fails, clear cookies and return error
      const response = NextResponse.json(
        { error: 'Token refresh failed' },
        { status: 401 }
      )
      
      response.cookies.delete('access_token')
      response.cookies.delete('user')
      
      return response
    }

    const refreshData = await refreshResponse.json()
    const newToken = refreshData.access_token || refreshData.token

    if (!newToken) {
      return NextResponse.json(
        { error: 'No new token received' },
        { status: 401 }
      )
    }

    // Parse existing user data
    const userData = JSON.parse(userCookie)

    // Update cookies with new token
    const response = NextResponse.json({
      token: newToken,
      user: userData,
      message: 'Token refreshed successfully'
    })

    const isProduction = process.env.NODE_ENV === 'production'
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    }

    response.cookies.set('access_token', newToken, cookieOptions)
    response.cookies.set('user', JSON.stringify(userData), cookieOptions)

    return response

  } catch (error) {
    console.error('Token refresh error:', error)
    
    const response = NextResponse.json(
      { error: 'Internal server error during token refresh' },
      { status: 500 }
    )
    
    // Clear cookies on error
    response.cookies.delete('access_token')
    response.cookies.delete('user')
    
    return response
  }
}