import { createInsertSchema } from "drizzle-zod";
import {
  date,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { programsTable } from "./programs";

export const graduatesTable = pgTable("graduates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  programId: integer("program_id")
    .notNull()
    .references(() => programsTable.id),
  cohort: text("cohort").notNull(),
  location: text("location").notNull(),
  availability: text("availability").notNull(),
  skills: text("skills").array().notNull().default([]),
  visibility: text("visibility").notNull().default("needs-review"),
  resumeName: text("resume_name"),
  resumeUpdated: date("resume_updated", { mode: "string" }),
  placementStatus: text("placement_status").notNull().default("seeking"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertGraduateSchema = createInsertSchema(graduatesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertGraduate = z.infer<typeof insertGraduateSchema>;
export type Graduate = typeof graduatesTable.$inferSelect;