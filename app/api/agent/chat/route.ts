import { NextRequest } from "next/server"
import { cookies } from 'next/headers'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

async function makeBackendRequest(authToken: string, messageData: any) {
  return fetch(`${API_BASE_URL}/agent/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${authToken}`,
    },
    body: JSON.stringify(messageData)
  })
}

export async function POST(request: NextRequest) {
  try {
    const { messages, conversationId } = await request.json()
    console.log({ conversationId })
    
    // Get auth token from header or cookies
    let authToken = request.headers.get("authorization")?.replace('Bearer ', '')
    
    if (!authToken) {
      // Fallback to cookies
      const cookieStore = await cookies()
      authToken = cookieStore.get('access_token')?.value
    }

    if (!authToken) {
      console.error('No auth token found for AI chat request')
      return new Response("Authentication required", { status: 401 })
    }

    // Convert the last message to send to backend
    const lastMessage = messages[messages.length - 1]
    const messageText = lastMessage.parts?.find((part: { type: string; text: string }) => part.type === 'text')?.text || lastMessage.text

    const messageData = {
      message: messageText,
      ...(conversationId && { conversationId })
    }

    // Call backend with retry logic for token refresh
    let backendResponse = await makeBackendRequest(authToken, messageData)
    
    // If unauthorized, try to refresh token and retry once
    if (backendResponse.status === 401) {
      console.log('AI chat request unauthorized, attempting token refresh...')
      
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh-jwt-token`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        })

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json()
          const newToken = refreshData.access_token || refreshData.token
          
          if (newToken) {
            console.log('Token refreshed successfully, retrying AI chat request...')
            
            // Retry with new token
            backendResponse = await makeBackendRequest(newToken, messageData)
            
            // Update cookie with new token for future requests
            if (backendResponse.ok) {
              const response = new Response(backendResponse.body, {
                headers: {
                  "Content-Type": "text/event-stream",
                  "Cache-Control": "no-cache",
                  "Connection": "keep-alive",
                  "Access-Control-Allow-Origin": "*",
                  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                  "Access-Control-Allow-Headers": "Content-Type, Authorization",
                },
              })
              
              // Set new token cookie
              const isProduction = process.env.NODE_ENV === 'production'
              response.headers.set('Set-Cookie', `access_token=${newToken}; HttpOnly; Secure=${isProduction}; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`)
              
              return response
            }
          }
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError)
      }
    }

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text().catch(() => 'Unknown error')
      console.error('Backend AI chat error:', backendResponse.status, errorText)
      return new Response(`Backend API error: ${backendResponse.statusText}`, {
        status: backendResponse.status
      })
    }

    // Forward the SSE stream directly from backend
    return new Response(backendResponse.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    })
  } catch (error) {
    console.error("Chat stream error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}