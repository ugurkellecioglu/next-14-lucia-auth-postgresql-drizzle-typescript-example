import { Google, generateCodeVerifier, generateState } from "arctic"

export const google = new Google(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  process.env.NEXT_PUBLIC_BASE_URL + "/api/oauth/google"
)
