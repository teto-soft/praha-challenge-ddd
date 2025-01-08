import { boolean, pgTable, varchar } from "drizzle-orm/pg-core";

export const tasks = pgTable("tasks", {
  id: varchar("id").notNull(),
  title: varchar("title").notNull(),
  isDone: boolean("isDone").notNull(),
});
