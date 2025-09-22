import { redirect } from "next/navigation"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export async function GET() {
  // Redirect to the backend Google OAuth endpoint
  redirect(`${API_BASE_URL}/auth/google`)
}