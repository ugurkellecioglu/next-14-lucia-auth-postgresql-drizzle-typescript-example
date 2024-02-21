import { DrizzlePostgreSQLAdapter } from "@lucia-auth/adapter-drizzle"
import db from "../database"
import { sessionTable, userTable } from "../database/schema"

const adapter = new DrizzlePostgreSQLAdapter(db, sessionTable, userTable)

export default adapter
