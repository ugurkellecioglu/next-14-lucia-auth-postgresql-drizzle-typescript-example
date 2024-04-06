import db from "@/lib/database"
import { oauthAccountTable, userTable } from "@/lib/database/schema"
import { lucia } from "@/lib/lucia"
import { facebook, google } from "@/lib/lucia/oauth"
import { and, eq } from "drizzle-orm"
import { generateId } from "lucia"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

// http://localhost:3000/api/oauth/facebook?code=AQA-g3EK2P9z73O3RMlhDYWaEshYuSrz_kwAomPYTv3lZbkdzvVhKivE8rZCpDWIfllZC5AyZOQosX7g5x5qt-PXhvnUrn0aaQdN3N2vsrsF6_c4QsBsmpkcusMGEbjNrY5zW3hU-POmf1uysK21rQ_jqoFBipYiz0eUOTxzrAzuHKOXdhjXmFAD9odP99aqUeTPdEnGQOJ4V0Gc89-A568jrLRrs_KUpzgfht58qh41iGBmH7en9Q0hDq-Jzq_4Geqaxi_Ld5b-oCaIiG7Tq4lIAKZ5LkezpLoqjC1sW6IdK_800CDhW_g3iTyadKBlPGlvDJRAOkNnzM5mU825ZTp_MKdJBK_ei5aqn2R4XVtmjCu180ViuHbdhPKWBVbhGzA&state=rq3NP0N-vqoes2MAobKj0dr56Fbr7u5u43ToYSibRd4#_=_

export const GET = async (req: NextRequest) => {
  try {
    const url = new URL(req.url)
    const searchParams = url.searchParams

    const code = searchParams.get("code")

    if (!code) {
      return Response.json(
        { error: "Invalid request" },
        {
          status: 400,
        }
      )
    }

    const { accessToken, accessTokenExpiresAt } =
      await facebook.validateAuthorizationCode(code)

    const facebookRes = await fetch(
      `https://graph.facebook.com/me?access_token=${accessToken}&fields=id,name,email,picture`,
      {
        method: "GET",
      }
    )

    const facebookData = (await facebookRes.json()) as {
      name: string
      id: string
      email: string
      picture: {
        height: number
        is_silhouette: boolean
        url: string
        width: number
      }
    }

    const transactionRes = await db.transaction(async (trx) => {
      try {
        const existingUser = await trx.query.userTable.findFirst({
          where: (table) => eq(table.email, facebookData.email),
        })

        if (!existingUser) {
          const userId = generateId(15)
          await trx.insert(userTable).values({
            id: userId,
            email: facebookData.email,
            name: facebookData.name,
            profilePictureUrl: facebookData.picture.url,
            isEmailVerified: true,
          })

          await trx.insert(oauthAccountTable).values({
            accessToken,
            expiresAt: accessTokenExpiresAt,
            provider: "facebook",
            providerUserId: facebookData.id,
            userId,
            id: generateId(15),
          })

          return {
            success: true,
            message: "User logged in successfully",
            data: {
              id: userId,
            },
          }
        } else {
          await trx
            .update(oauthAccountTable)
            .set({
              accessToken,
              expiresAt: accessTokenExpiresAt,
            })
            .where(
              and(
                eq(oauthAccountTable.providerUserId, facebookData.id),
                eq(oauthAccountTable.provider, "facebook")
              )
            )
        }

        return {
          success: true,
          message: "User logged in successfully",
          data: {
            id: existingUser?.id,
          },
        }
      } catch (error: any) {
        return {
          success: false,
          message: error.message,
          data: null,
        }
      }
    })

    if (!transactionRes.success || !transactionRes.data)
      throw new Error(transactionRes.message)

    const session = await lucia.createSession(transactionRes?.data?.id, {
      expiresIn: 60 * 60 * 24 * 30,
    })
    const sessionCookie = lucia.createSessionCookie(session.id)

    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    )

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
