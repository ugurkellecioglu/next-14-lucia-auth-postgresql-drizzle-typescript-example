import { DrizzlePostgreSQLAdapter } from "@lucia-auth/adapter-drizzle"
import db from "../database/db"

import * as schema from "../database/schema"

const adapter = new DrizzlePostgreSQLAdapter(
  db,
  schema.sessionTable,
  schema.userTable
)

export default adapter
