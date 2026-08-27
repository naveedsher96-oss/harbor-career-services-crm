import { createInsertSchema } from "drizzle-zod";
import {
  date,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { employersTable } from "./employers";
import { programsTable } from "./programs";

export const jobsTable = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  employerId: integer("employer_id")
    .notNull()
    .references(() => employersTable.id),
  location: text("location").notNull(),
  schedule: text("schedule").notNull(),
  pay: text("pay"),
  description: text("description"),
  status: text("status").notNull().default("open"),
  postedDate: date("posted_date", { mode: "string" }).notNull(),
  expiresDate: date("expires_date", { mode: "string" }),
  applicants: integer("applicants").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const jobProgramsTable = pgTable(
  "job_programs",
  {
    jobId: integer("job_id")
      .notNull()
      .references(() => jobsTable.id, { onDelete: "cascade" }),
    programId: integer("program_id")
      .notNull()
      .references(() => programsTable.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.jobId, table.programId] }),
  }),
);

export const insertJobSchema = createInsertSchema(jobsTable).omit({
  id: true,
  createdAt: true,
  postedDate: true,
  applicants: true,
});
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobsTable.$inferSelect;