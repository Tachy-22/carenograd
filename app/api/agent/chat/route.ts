import { NextRequest } from "next/server"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const { messages, conversationId } = await request.json()
    console.log({ conversationId })
    // Get authorization header from the request
    const authHeader = request.headers.get("authorization")

    if (!authHeader) {
      return new Response("Unauthorized", { status: 401 })
    }

    // Convert the last message to send to backend
    const lastMessage = messages[messages.length - 1]
    const messageText = lastMessage.parts?.find((part: { type: string; text: string }) => part.type === 'text')?.text || lastMessage.text

    // Call the backend streaming API and directly forward the stream
    const backendResponse = await fetch("http://localhost:3000/agent/chat/stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify({
        message: messageText,
        ...(conversationId && { conversationId })
      })
    })

    if (!backendResponse.ok) {
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