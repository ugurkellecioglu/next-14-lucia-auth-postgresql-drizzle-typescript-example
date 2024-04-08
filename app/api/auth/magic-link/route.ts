import { NextRequest } from "next/server"
import jwt from "jsonwebtoken"
import db from "@/lib/database"
import { eq } from "drizzle-orm"
import { magicLinkTable, userTable } from "@/lib/database/schema"
import { lucia } from "@/lib/lucia"
import { cookies } from "next/headers"
export const GET = async (req: NextRequest) => {
  try {
    const url = new URL(req.url)

    const searchParams = url.searchParams

    const token = searchParams.get("token")

    if (!token) {
      return Response.json(
        {
          error: "Token is not existed",
        },
        {
          status: 400,
        }
      )
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      email: string
      userId: string
    }
    const existedToken = await db.query.magicLinkTable.findFirst({
      where: eq(magicLinkTable.userId, decoded.userId),
    })

    if (!existedToken) {
      return Response.json(
        {
          error: "Invalid token",
        },
        {
          status: 400,
        }
      )
    } else {
      await db
        .delete(magicLinkTable)
        .where(eq(magicLinkTable.userId, decoded.userId))
    }

    const session = await lucia.createSession(decoded.userId, {
      expiresIn: 60 * 60 * 24 * 30,
    })

    const sessionCookie = lucia.createSessionCookie(session.id)

    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    )

    return Response.redirect(new URL(process.env.NEXT_PUBLIC_BASE_URL!), 302)
  } catch (e: any) {
    return Response.json(
      {
        error: e.message,
      },
      {
        status: 400,
      }
    )
  }
}
