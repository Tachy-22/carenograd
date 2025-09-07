import { NextRequest } from "next/server"
import { redirect } from "next/navigation"

export async function GET(request: NextRequest) {
  // Redirect to the backend Google OAuth endpoint
  redirect("http://localhost:3000/auth/google")
}