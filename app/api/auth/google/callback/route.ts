import { NextRequest, NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state")

    if (!code) {
      return NextResponse.redirect(new URL("/?error=auth_failed", request.url))
    }

    // Forward to backend callback
    const backendUrl = new URL(`${API_BASE_URL}/auth/google/callback`)
    backendUrl.searchParams.set("code", code)
    if (state) backendUrl.searchParams.set("state", state)

   // console.log('Forwarding to backend:', backendUrl.toString())

    const response = await fetch(backendUrl.toString(), {
      method: "GET",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })

   // console.log('Backend response status:', response.status, response)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend error:', response.status, errorText)
      return NextResponse.redirect(new URL("/?error=auth_failed&reason=backend_error", request.url))
    }

    const data = await response.json()

   // console.log({ data })
    // Redirect to auth callback page with token and user info
    const redirectUrl = new URL("/auth/google/callback", request.url)
    redirectUrl.searchParams.set("token", data.access_token)
    redirectUrl.searchParams.set("user", encodeURIComponent(JSON.stringify(data.user)))

    return NextResponse.redirect(redirectUrl)

  } catch (error) {
    console.error("Auth callback error:", error)
    return NextResponse.redirect(new URL("/?error=auth_failed", request.url))
  }
}