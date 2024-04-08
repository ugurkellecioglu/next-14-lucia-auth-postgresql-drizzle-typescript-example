"use server"
import db from "@/lib/database"
import { magicLinkTable, userTable } from "@/lib/database/schema"
import { SignInSchema } from "@/types"
import { eq } from "drizzle-orm"
import { generateId } from "lucia"
import { z } from "zod"
import jwt from "jsonwebtoken"

import { Resend } from "resend"
const sendEmail = async (email: string, url: string) => {
  const resend = new Resend(process.env.RESEND_SECRET)

  await resend.emails.send({
    from: "Acme <onboarding@resend.dev>",
    to: [email],
    subject: "Magic Link",
    text: `Click the link to sign in: ${url}`,
    headers: {
      "X-Entity-Ref-ID": generateId(10),
    },
  })
}

const generateMagicLink = async (email: string, userId: string) => {
  const token = jwt.sign({ email: email, userId }, process.env.JWT_SECRET!, {
    expiresIn: "5m",
  })

  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/magic-link?token=${token}`

  return {
    success: true,
    message: "Magic link generated successfully",
    data: {
      token,
      url,
    },
  }
}

export const signIn = async (values: z.infer<typeof SignInSchema>) => {
  try {
    SignInSchema.parse(values)

    const existedUser = await db.query.userTable.findFirst({
      where: eq(userTable.email, values.email),
    })

    if (existedUser) {
      const res = await generateMagicLink(values.email, existedUser.id)

      await db.insert(magicLinkTable).values({
        userId: existedUser.id,
        token: res.data.token,
      })
      await sendEmail(values.email, res.data.url)
      console.log(res.data)
    } else {
      // we will create the user
      const userId = generateId(15)
      await db.insert(userTable).values({
        email: values.email,
        id: userId,
      })
      const res = await generateMagicLink(values.email, userId)

      await db.insert(magicLinkTable).values({
        userId,
        token: res.data.token,
      })
      await sendEmail(values.email, res.data.url)
    }

    return {
      success: true,
      message: "Magic link sent successfully",
      data: null,
    }
  } catch (error: any) {
    return {
      success: false,
      message: error?.message,
      data: null,
    }
  }
}
