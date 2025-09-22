import { NextRequest } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader) {
      return new Response("Unauthorized", { status: 401 })
    }

    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: "GET",
      headers: {
        "Authorization": authHeader
      }
    })

    if (!response.ok) {
      return new Response(response.statusText, {
        status: response.status
      })
    }

    const data = await response.json()
    return Response.json(data)

  } catch (error) {
    console.error("Profile fetch error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}