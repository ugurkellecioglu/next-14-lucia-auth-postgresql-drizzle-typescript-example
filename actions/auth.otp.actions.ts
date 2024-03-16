"use server"
import sns from "@/lib/aws"
import db from "@/lib/database"
import { otpTable, userTable } from "@/lib/database/schema"
import { lucia } from "@/lib/lucia"
import { eq } from "drizzle-orm"
import { generateId } from "lucia"
import { cookies } from "next/headers"

export async function sendSMS(
  phoneNumber: string,
  message: string
): Promise<string> {
  try {
    const params = {
      Message: message,
      PhoneNumber: phoneNumber,
    }

    const data = await sns.publish(params).promise()
    console.debug("SMS sent:", data)
    return data.MessageId
  } catch (error) {
    console.error("Error sending SMS:", error)
    throw error
  }
}

const generateOTP = () => {
  // Generate a 6 digit OTP
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function signIn(phoneNumber: string) {
  const res = await db.transaction(async (trx) => {
    try {
      let existedUser = (await trx.query.userTable.findFirst({
        where: (table) => eq(table.phoneNumber, phoneNumber),
        with: {
          otp: true,
        },
      })) as typeof userTable.$inferInsert & {
        otp?: typeof otpTable.$inferInsert
      }

      if (existedUser?.otp) {
        if (existedUser.otp.sentAt > new Date(Date.now() - 60000)) {
          return {
            success: false,
            message: "Please wait 30 seconds before requesting another OTP",
          }
        }

        await trx.delete(otpTable).where(eq(otpTable.userId, existedUser.id))
      }

      const otp = generateOTP()
      if (!existedUser) {
        const r = await trx
          .insert(userTable)
          .values({
            id: generateId(15),
            phoneNumber: phoneNumber,
          })
          .returning()

        existedUser = r[0]
      }

      await trx.insert(otpTable).values({
        id: generateId(15),
        userId: existedUser?.id,
        code: otp,
        expiresAt: new Date(Date.now() + 300000), // 5 minutes
        sentAt: new Date(),
      })

      console.debug("OTP:", otp)

      const messageId = await sendSMS(phoneNumber, `Your OTP is ${otp}`)
      console.debug(messageId)
      return {
        success: true,
        data: {
          messageId: messageId,
        },
      }
    } catch (error: any) {
      console.log("Error sending OTP:", error)

      return {
        success: false,
        message: error.message,
      }
    }
  })

  if (res.success) {
    return res
  } else {
    return {
      success: false,
      message: res.message,
    }
  }
}

export async function verifyOtp(phoneNumber: string, otp: string) {
  try {
    const existedOtp = await db.query.userTable.findFirst({
      where: (table) => eq(table.phoneNumber, phoneNumber),
      with: {
        otp: true,
      },
    })

    console.debug("existedOtp", existedOtp)

    if (!existedOtp) {
      return {
        success: false,
        message: "OTP not found",
      }
    }

    if (existedOtp.otp.code !== otp) {
      return {
        success: false,
        message: "Invalid OTP",
      }
    }

    if (existedOtp.otp.expiresAt < new Date()) {
      return {
        success: false,
        message: "OTP expired",
      }
    }

    await db.delete(otpTable).where(eq(otpTable.userId, existedOtp.id))

    const session = await lucia.createSession(existedOtp.id, {
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
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    }
  }
}
