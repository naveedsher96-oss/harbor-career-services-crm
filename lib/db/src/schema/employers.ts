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
import { programsTable } from "./programs";

export const employersTable = pgTable("employers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  location: text("location").notNull(),
  website: text("website"),
  status: text("status").notNull().default("prospect"),
  primaryContact: text("primary_contact"),
  primaryEmail: text("primary_email"),
  lastContacted: date("last_contacted", { mode: "string" }),
  nextFollowUp: date("next_follow_up", { mode: "string" }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const employerProgramsTable = pgTable(
  "employer_programs",
  {
    employerId: integer("employer_id")
      .notNull()
      .references(() => employersTable.id, { onDelete: "cascade" }),
    programId: integer("program_id")
      .notNull()
      .references(() => programsTable.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.employerId, table.programId] }),
  }),
);

export const insertEmployerSchema = createInsertSchema(employersTable).omit({
  id: true,
  createdAt: true,
  lastContacted: true,
});
export type InsertEmployer = z.infer<typeof insertEmployerSchema>;
export type Employer = typeof employersTable.$inferSelect;