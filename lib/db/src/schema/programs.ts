import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const programsTable = pgTable("programs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  color: text("color").notNull(),
});

export const insertProgramSchema = createInsertSchema(programsTable).omit({
  id: true,
});
export type InsertProgram = z.infer<typeof insertProgramSchema>;
export type Program = typeof programsTable.$inferSelect;

export type ProgramCounts = {
  id: number;
  name: string;
  shortName: string;
  color: string;
  employerCount: number;
  graduateCount: number;
  openJobCount: number;
};