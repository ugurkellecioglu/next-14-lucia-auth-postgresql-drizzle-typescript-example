import { validateRequest } from "@/lib/lucia"
import { redirect } from "next/navigation"

export default async function AdminPage() {
  const { user } = await validateRequest()

  if (!user) {
    return redirect("/sign-in")
  }

  if (user.role !== "admin") {
    return redirect("/")
  }

  return (
    <>
      <h1>Admin Page</h1>
      <p>You shouldn't see it unless you are an admin</p>
    </>
  )
}
