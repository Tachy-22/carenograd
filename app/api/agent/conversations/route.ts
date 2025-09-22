import { NextRequest } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader) {
      return new Response("Unauthorized", { status: 401 })
    }

    const response = await fetch(`${API_BASE_URL}/agent/conversations`, {
      method: "GET",
      headers: {
        "Authorization": authHeader
      },
      next: { tags: ['conversations'] }
    })

    if (!response.ok) {
      return new Response(response.statusText, {
        status: response.status
      })
    }

    const data = await response.json()
    return Response.json(data)

  } catch (error) {
    console.error("Conversations fetch error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}