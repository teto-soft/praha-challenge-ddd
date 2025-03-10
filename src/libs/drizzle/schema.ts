import {pgTable, unique, varchar} from "drizzle-orm/pg-core";

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey(),
  title: varchar("title").notNull(),
  body: varchar("body").notNull(),
});

export const teams = pgTable("teams", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
});

export const participants = pgTable("participants", {
  id: varchar("id").primaryKey(),
  teamId: varchar("team_id").notNull(),
  name: varchar("name").notNull(),
  email: varchar("email").notNull(),
  enrollmentStatus: varchar("enrollment_status").notNull(),
});

export const assignments = pgTable(
  "assignments",
  {
    id: varchar("id").primaryKey(),
    taskId: varchar("task_id").notNull(),
    participantId: varchar("participant_id").notNull(),
    progressStatus: varchar("progress_status").notNull(),
  },
  ({ taskId, participantId }) => [
    unique("task_participant_idx").on(taskId, participantId),
  ],
);
