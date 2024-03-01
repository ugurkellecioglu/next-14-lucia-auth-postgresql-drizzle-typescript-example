"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { SignInSchema } from "../types"
import {
  resendVerificationEmail,
  signIn,
  signUp,
} from "../actions/auth.actions"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useCountdown } from "usehooks-ts"

export function SignInForm() {
  const [count, { startCountdown, stopCountdown, resetCountdown }] =
    useCountdown({
      countStart: 60,
      intervalMs: 1000,
    })

  useEffect(() => {
    if (count === 0) {
      stopCountdown()
      resetCountdown()
    }
  }, [count])

  const [showResendVerificationEmail, setShowResendVerificationEmail] =
    useState(false)

  const router = useRouter()

  const form = useForm<z.infer<typeof SignInSchema>>({
    resolver: zodResolver(SignInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: z.infer<typeof SignInSchema>) {
    const res = await signIn(values)
    if (res.error) {
      toast({
        variant: "destructive",
        description: res.error,
      })

      if (res?.key === "email_not_verified") {
        setShowResendVerificationEmail(true)
      }
    } else if (res.success) {
      toast({
        variant: "default",
        description: "Signed in successfully",
      })

      router.push("/")
    }
  }

  const onResendVerificationEmail = async () => {
    const res = await resendVerificationEmail(form.getValues("email"))
    if (res.error) {
      toast({
        variant: "destructive",
        description: res.error,
      })
    } else if (res.success) {
      toast({
        variant: "default",
        description: res.success,
      })
      startCountdown()
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="shadcn" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />{" "}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input placeholder="****" type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
      {showResendVerificationEmail && (
        <Button
          disabled={count > 0 && count < 60}
          onClick={onResendVerificationEmail}
          variant={"link"}
        >
          Send verification email {count > 0 && count < 60 && `in ${count}s`}
        </Button>
      )}
    </Form>
  )
}
