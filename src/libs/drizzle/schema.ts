import {pgTable, varchar} from "drizzle-orm/pg-core";

export const tasks = pgTable("tasks", {
  id: varchar("id").notNull(),
  title: varchar("title").notNull(),
  body: varchar("body").notNull(),
});
