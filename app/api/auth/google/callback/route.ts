import { redirect } from "next/navigation"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    
    if (!code) {
      return NextResponse.redirect(new URL("/?error=auth_failed", request.url))
    }

    // Forward to backend callback
    const backendUrl = new URL("http://localhost:3000/auth/google/callback")
    backendUrl.searchParams.set("code", code)
    if (state) backendUrl.searchParams.set("state", state)

    const response = await fetch(backendUrl.toString(), {
      method: "GET"
    })

    if (!response.ok) {
      return NextResponse.redirect(new URL("/?error=auth_failed", request.url))
    }

    const data = await response.json()

    // Redirect to chat with token and user info
    const redirectUrl = new URL("/chat", request.url)
    redirectUrl.searchParams.set("token", data.access_token)
    redirectUrl.searchParams.set("user", JSON.stringify(data.user))

    return NextResponse.redirect(redirectUrl)

  } catch (error) {
    console.error("Auth callback error:", error)
    return NextResponse.redirect(new URL("/?error=auth_failed", request.url))
  }
}
