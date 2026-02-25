import { auth } from "@/auth"

export const runtime = 'nodejs'

export default auth((_req) => {
  // Planner is accessible without login (guests get one free generation).
  // Add route-level auth guards only for strictly private pages (e.g. /dashboard).
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
