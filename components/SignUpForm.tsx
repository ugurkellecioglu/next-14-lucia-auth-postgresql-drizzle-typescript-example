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
import { SignUpSchema } from "../types"
import { resendVerificationEmail, signUp } from "../actions/auth.actions"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useCountdown } from "usehooks-ts"

export function SignUpForm() {
  const router = useRouter()
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

  const form = useForm<z.infer<typeof SignUpSchema>>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(values: z.infer<typeof SignUpSchema>) {
    const res = await signUp(values)
    startCountdown()
    if (res.error) {
      toast({
        variant: "destructive",
        description: res.error,
      })
    } else if (res.success) {
      toast({
        variant: "default",
        description:
          "We've sent an verification email to your inbox. Please verify your email to continue.",
      })
      setShowResendVerificationEmail(true)
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
    <>
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
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm password</FormLabel>
                <FormControl>
                  <Input placeholder="****" type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Submit</Button>
        </form>
      </Form>

      {showResendVerificationEmail && (
        <Button
          disabled={count > 0 && count < 60}
          onClick={onResendVerificationEmail}
          variant={"link"}
        >
          Send verification email {count > 0 && count < 60 && `in ${count}s`}
        </Button>
      )}
    </>
  )
}
