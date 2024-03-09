import db from "@/lib/database"
import { oauthAccountTable, userTable } from "@/lib/database/schema"
import { lucia } from "@/lib/lucia"
import { github, google } from "@/lib/lucia/oauth"
import { generateState } from "arctic"
import { eq } from "drizzle-orm"
import { generateId } from "lucia"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export const GET = async (req: NextRequest) => {
  try {
    const url = new URL(req.url)
    const searchParams = url.searchParams

    const code = searchParams.get("code")
    const state = searchParams.get("state")

    if (!code || !state) {
      return Response.json(
        { error: "Invalid request" },
        {
          status: 400,
        }
      )
    }

    const savedState = cookies().get("state")?.value

    if (!savedState) {
      return Response.json(
        { error: "saved state is not exists" },
        {
          status: 400,
        }
      )
    }

    if (savedState !== state) {
      return Response.json(
        {
          error: "State does not match",
        },
        {
          status: 400,
        }
      )
    }

    const { accessToken } = await github.validateAuthorizationCode(code)

    const githubRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      method: "GET",
    })

    const githubData = (await githubRes.json()) as any

    console.log("githubData", githubData)

    db.transaction(async (trx) => {
      const user = await trx.query.userTable.findFirst({
        where: eq(userTable.id, githubData.id),
      })
      if (!user) {
        const createdUserRes = await trx
          .insert(userTable)
          .values({
            id: githubData.id,
            name: githubData.name,
            profilePictureUrl: githubData.avatar_url,
          })
          .returning({
            id: userTable.id,
          })

        if (createdUserRes.length === 0) {
          trx.rollback()
          return Response.json(
            { error: "Failed to create user" },
            {
              status: 500,
            }
          )
        }

        const createdOAuthAccountRes = await trx
          .insert(oauthAccountTable)
          .values({
            accessToken,
            id: generateId(15),
            provider: "github",
            providerUserId: githubData.id,
            userId: githubData.id,
          })

        if (createdOAuthAccountRes.rowCount === 0) {
          trx.rollback()
          return Response.json(
            { error: "Failed to create OAuthAccountRes" },
            {
              status: 500,
            }
          )
        }
      } else {
        const updatedOAuthAccountRes = await trx
          .update(oauthAccountTable)
          .set({
            accessToken,
          })
          .where(eq(oauthAccountTable.id, githubData.id))

        if (updatedOAuthAccountRes.rowCount === 0) {
          trx.rollback()
          return Response.json(
            { error: "Failed to update OAuthAccountRes" },
            {
              status: 500,
            }
          )
        }
      }

      return NextResponse.redirect(
        new URL("/dashboard", process.env.NEXT_PUBLIC_BASE_URL),
        {
          status: 302,
        }
      )
    })

    const session = await lucia.createSession(githubData.id, {
      expiresIn: 60 * 60 * 24 * 30,
    })
    const sessionCookie = lucia.createSessionCookie(session.id)

    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    )

    cookies().set("state", "", {
      expires: new Date(0),
    })

    return NextResponse.redirect(
      new URL("/", process.env.NEXT_PUBLIC_BASE_URL),
      {
        status: 302,
      }
    )
  } catch (error: any) {
    return Response.json(
      { error: error.message },
      {
        status: 500,
      }
    )
  }
}
