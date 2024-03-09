"use server"
import { z } from "zod"
import { SignInSchema, SignUpSchema } from "../types"
import { generateId } from "lucia"
import db from "@/lib/database"
import { emailVerificationTable, userTable } from "@/lib/database/schema"
import { lucia, validateRequest } from "@/lib/lucia"
import { cookies } from "next/headers"
import { eq } from "drizzle-orm"
import * as argon2 from "argon2"
import jwt from "jsonwebtoken"
import { sendEmail } from "@/lib/email"
import { generateCodeVerifier, generateState } from "arctic"
import { github, google } from "@/lib/lucia/oauth"

export const resendVerificationEmail = async (email: string) => {
  try {
    const existingUser = await db.query.userTable.findFirst({
      where: (table) => eq(table.email, email),
    })

    if (!existingUser) {
      return {
        error: "User not found",
      }
    }

    if (existingUser.isEmailVerified === true) {
      return {
        error: "Email already verified",
      }
    }

    const existedCode = await db.query.emailVerificationTable.findFirst({
      where: eq(emailVerificationTable.userId, existingUser.id),
    })

    if (!existedCode) {
      return {
        error: "Code not found",
      }
    }

    const sentAt = new Date(existedCode.sentAt)
    const isOneMinuteHasPassed = new Date().getTime() - sentAt.getTime() > 60000 // 1 minute

    if (!isOneMinuteHasPassed) {
      return {
        error:
          "Email already sent next email in " +
          (60 - Math.floor((new Date().getTime() - sentAt.getTime()) / 1000)) +
          " seconds",
      }
    }

    const code = Math.random().toString(36).substring(2, 8)

    await db
      .update(emailVerificationTable)
      .set({
        code,
        sentAt: new Date(),
      })
      .where(eq(emailVerificationTable.userId, existingUser.id))

    const token = jwt.sign(
      { email, userId: existingUser.id, code },
      process.env.JWT_SECRET!,
      {
        expiresIn: "5m",
      }
    )

    const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/verify-email?token=${token}`
    await sendEmail({
      html: `<a href="${url}">Verify your email</a>`,
      subject: "Verify your email",
      to: email,
    })
    console.log(url)

    return {
      success: "Email sent",
    }
  } catch (error: any) {
    return {
      error: error?.message,
    }
  }
}

export const signUp = async (values: z.infer<typeof SignUpSchema>) => {
  console.log(values)

  const hashedPassword = await argon2.hash(values.password)
  const userId = generateId(15)

  try {
    await db.insert(userTable).values({
      id: userId,
      email: values.email,
      hashedPassword,
    })

    // generate a random string 6 characters long
    const code = Math.random().toString(36).substring(2, 8)

    await db.insert(emailVerificationTable).values({
      code,
      userId,
      id: generateId(15),
      sentAt: new Date(),
    })

    const token = jwt.sign(
      { email: values.email, userId, code },
      process.env.JWT_SECRET!,
      {
        expiresIn: "5m",
      }
    )

    const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/verify-email?token=${token}`

    // send an email at this step.

    console.log(url)

    await sendEmail({
      html: `<a href="${url}">Verify your email</a>`,
      subject: "Verify your email",
      to: values.email,
    })

    // const session = await lucia.createSession(userId, {
    //   expiresIn: 60 * 60 * 24 * 30,
    // })

    // const sessionCookie = lucia.createSessionCookie(session.id)

    // cookies().set(
    //   sessionCookie.name,
    //   sessionCookie.value,
    //   sessionCookie.attributes
    // )

    return {
      success: true,
      data: {
        userId,
      },
    }
  } catch (error: any) {
    return {
      error: error?.message,
    }
  }
}

export const signIn = async (values: z.infer<typeof SignInSchema>) => {
  try {
    SignInSchema.parse(values)
  } catch (error: any) {
    return {
      error: error.message,
    }
  }

  const existingUser = await db.query.userTable.findFirst({
    where: (table) => eq(table.email, values.email),
  })

  if (!existingUser) {
    return {
      error: "User not found",
    }
  }

  if (!existingUser.hashedPassword) {
    return {
      error: "User not found",
    }
  }

  const isValidPassword = await argon2.verify(
    existingUser.hashedPassword,
    values.password
  )

  if (!isValidPassword) {
    return {
      error: "Incorrect username or password",
    }
  }

  if (existingUser.isEmailVerified === false) {
    return {
      error: "Email not verified",
      key: "email_not_verified",
    }
  }

  const session = await lucia.createSession(existingUser.id, {
    expiresIn: 60 * 60 * 24 * 30,
  })

  const sessionCookie = lucia.createSessionCookie(session.id)

  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  )

  return {
    success: "Logged in successfully",
  }
}

export const signOut = async () => {
  try {
    const { session } = await validateRequest()

    if (!session) {
      return {
        error: "Unauthorized",
      }
    }

    await lucia.invalidateSession(session.id)

    const sessionCookie = lucia.createBlankSessionCookie()

    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    )
  } catch (error: any) {
    return {
      error: error?.message,
    }
  }
}

export const createGoogleAuthorizationURL = async () => {
  try {
    const state = generateState()
    const codeVerifier = generateCodeVerifier()

    cookies().set("codeVerifier", codeVerifier, {
      httpOnly: true,
    })

    cookies().set("state", state, {
      httpOnly: true,
    })

    const authorizationURL = await google.createAuthorizationURL(
      state,
      codeVerifier,
      {
        scopes: ["email", "profile"],
      }
    )

    return {
      success: true,
      data: authorizationURL,
    }
  } catch (error: any) {
    return {
      error: error?.message,
    }
  }
}

export const createGithubAuthorizationURL = async () => {
  try {
    const state = generateState() // generate a random string 6 characters long

    cookies().set("state", state, {
      httpOnly: true,
    })

    const authorizationURL = await github.createAuthorizationURL(state, {
      scopes: ["user:email"],
    })

    return {
      success: true,
      data: authorizationURL,
    }
  } catch (error: any) {
    return {
      error: error?.message,
    }
  }
}
