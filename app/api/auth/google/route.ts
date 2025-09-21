import { redirect } from "next/navigation"

export async function GET() {
  // Redirect to the backend Google OAuth endpoint
  redirect("http://localhost:3000/auth/google")
}