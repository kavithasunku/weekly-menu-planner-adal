// Auth disabled for hackathon demo
// import { auth } from "@/auth"

// export const runtime = 'nodejs'

// export default auth((req) => {
//   const isLoggedIn = !!req.auth
//   const isOnPlanner = req.nextUrl.pathname.startsWith("/planner")

//   if (isOnPlanner && !isLoggedIn) {
//     return Response.redirect(new URL("/login", req.nextUrl))
//   }
// })

export default function middleware() {
  // Auth disabled - allow all requests
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
