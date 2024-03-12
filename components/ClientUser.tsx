"use client"

import { validateRequest } from "@/lib/lucia"
import { useSession } from "@/providers/Session.provider"
import { useEffect, useState } from "react"

export default function ClientUser() {
  const { user } = useSession()

  const [modifiedUser, setModifiedUser] = useState()

  useEffect(() => {
    setTimeout(() => {
      setModifiedUser({ ...user, modified: true })
    }, 3000)
  }, [])

  return (
    <div>
      <h1>Client User</h1>
      {JSON.stringify(modifiedUser)}
    </div>
  )
}
