import { Facebook, GitHub, Google } from "arctic"

export const google = new Google(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  process.env.NEXT_PUBLIC_BASE_URL + "/api/oauth/google"
)

export const github = new GitHub(
  process.env.GITHUB_CLIENT_ID!,
  process.env.GITHUB_CLIENT_SECRET!,
  {
    redirectURI: process.env.NEXT_PUBLIC_BASE_URL + "/api/oauth/github",
  }
)

export const facebook = new Facebook(
  process.env.FACEBOOK_CLIENT_ID!,
  process.env.FACEBOOK_CLIENT_SECRET!,
  process.env.NEXT_PUBLIC_BASE_URL + "/api/oauth/facebook"
)
