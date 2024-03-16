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
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { sendSMS, signIn, verifyOtp } from "@/actions/auth.otp.actions"
import { FakeDash, Slot } from "./OtpInput"
import { OTPInput, SlotProps } from "input-otp"
import { useCountdown } from "usehooks-ts"
import { useEffect, useState } from "react"
import "react-phone-number-input/style.css"
import PhoneInput from "react-phone-number-input"
export function SignInForm() {
  const router = useRouter()

  const form = useForm<z.infer<typeof SignInSchema>>({
    resolver: zodResolver(SignInSchema),
    defaultValues: {
      phoneNumber: "",
    },
  })
  const [isLoading, setIsLoading] = useState(false)
  const [count, { startCountdown, stopCountdown, resetCountdown }] =
    useCountdown({
      countStart: 60,
      intervalMs: 1000,
    })

  useEffect(() => {
    if (count === 0) {
      stopCountdown()
      resetCountdown()
      setShowOtpInput(false)
    }
  }, [count])
  const [showOtpInput, setShowOtpInput] = useState(false)
  async function onSubmit(values: z.infer<typeof SignInSchema>) {
    setIsLoading(true)

    const res = await signIn(values.phoneNumber)
    startCountdown()

    setIsLoading(false)

    if (res.success) {
      toast({
        description: "OTP sent successfully",
      })
      setShowOtpInput(true)
    } else {
      console.error(res.message)
      toast({
        description: res.message,
        variant: "destructive",
      })
    }
  }
  async function onComplete(otp: string) {
    console.log(otp)
    const res = await verifyOtp(form.getValues().phoneNumber, otp)
    if (res.success) {
      toast({
        description: "OTP verified",
      })

      router.push("/")
    } else {
      toast({
        description: res.message,
        variant: "destructive",
      })
    }
  }
  return (
    <>
      <Form {...form}>
        <form
          id="otp"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-2"
        >
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <PhoneInput
                    placeholder="Enter phone number"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground 
            [&>input]:outline-none

                    "
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            disabled={isLoading || (count > 0 && count < 60)}
            type="submit"
          >
            {isLoading
              ? "Sending OTP..."
              : `Send OTP ${count > 0 && count < 60 ? `in ${count}s` : ""}`}
          </Button>
        </form>
      </Form>

      {count > 0 && showOtpInput && (
        <div>
          <p className=" text-lg font-bold">Verify OTP</p>
          <p className="text-sm text-gray-500 mb-2">
            Enter the OTP sent to your phone number
          </p>
          <OTPInput
            onComplete={onComplete}
            maxLength={6}
            containerClassName="group flex items-center has-[:disabled]:opacity-30"
            render={({ slots }) => (
              <>
                <div className="flex">
                  {slots.slice(0, 6).map((slot, idx) => (
                    <Slot key={idx} {...slot} />
                  ))}
                </div>
              </>
            )}
          />
        </div>
      )}
    </>
  )
}
