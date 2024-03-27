"use server"

import { ResetPasswordSchema } from "@/types"
import { z } from "zod"
import * as argon2 from "argon2"
import { lucia, validateRequest } from "@/lib/lucia"
import db from "@/lib/database"
import { sessionTable, userTable } from "@/lib/database/schema"
import { eq } from "drizzle-orm"
import { cookies } from "next/headers"
export const resetPassword = async (
  values: z.infer<typeof ResetPasswordSchema>
) => {
  try {
    try {
      ResetPasswordSchema.parse(values)
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      }
    }

    const { user } = await validateRequest()
    if (!user) {
      return {
        success: false,
        message: "User not found",
      }
    }

    const existedUser = await db.query.userTable.findFirst({
      where: (table) => eq(table.id, user.id),
    })

    if (!existedUser) {
      return {
        success: false,
        message: "User not found",
      }
    }

    const isValidPassword = await argon2.verify(
      existedUser?.hashedPassword!,
      values.password
    )

    if (!isValidPassword) {
      return {
        success: false,
        message: "Invalid password",
      }
    }

    const hashedPassword = await argon2.hash(values.newPassword)

    await db
      .update(userTable)
      .set({
        hashedPassword,
      })
      .where(eq(userTable.id, user.id))

    await db.delete(sessionTable).where(eq(sessionTable.userId, user.id))

    const session = await lucia.createSession(existedUser.id, {
      expiresIn: 60 * 60 * 24 * 30,
    })

    const sessionCookie = lucia.createSessionCookie(session.id)

    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    )

    return {
      success: true,
      message: "Password updated",
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    }
  }
}
