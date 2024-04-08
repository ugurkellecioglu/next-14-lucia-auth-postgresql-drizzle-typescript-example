import { z } from "zod"
export const SignUpSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
})

export const SignInSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
})
