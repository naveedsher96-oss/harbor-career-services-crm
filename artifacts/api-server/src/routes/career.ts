import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, inArray, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  activitiesTable,
  employersTable,
  employerProgramsTable,
  graduatesTable,
  insertActivitySchema,
  insertEmployerSchema,
  insertGraduateSchema,
  insertJobSchema,
  jobProgramsTable,
  jobsTable,
  programsTable,
} from "@workspace/db";
import {
  CreateEmployerBody,
  CreateGraduateBody,
  CreateJobBody,
  GetDashboardSummaryResponse,
  GetActivityResponse,
  GetEmployerParams,
  GetEmployerResponse,
  GetJobMatchesParams,
  GetJobMatchesResponse,
  ListEmployersQueryParams,
  ListEmployersResponse,
  ListGraduatesQueryParams,
  ListGraduatesResponse,
  ListJobsQueryParams,
  ListJobsResponse,
  ListProgramsResponse,
  UpdateEmployerBody,
  UpdateEmployerParams,
  UpdateGraduateBody,
  UpdateGraduateParams,
  UpdateJobBody,
  UpdateJobParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

const programPalette = {
  pharmacy: "#0d9488",
  billing: "#6366f1",
  radiology: "#e06c2f",
  assistant: "#b45309",
} as const;

let seedPromise: Promise<void> | null = null;

const asDateString = (value: unknown): string | null =>
  value instanceof Date
    ? value.toISOString().slice(0, 10)
    : typeof value === "string" && value.length > 0
      ? value
      : null;

const asNumber = (value: unknown): number => Number(value ?? 0);

async function ensureSeedData() {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    const existing = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(programsTable);
    if (asNumber(existing[0]?.count) > 0) return;

    await db.transaction(async (tx) => {
      const programs = await tx
        .insert(programsTable)
        .values([
          {
            name: "Pharmacy Technician",
            shortName: "Pharmacy",
            color: programPalette.pharmacy,
          },
          {
            name: "Medical Billing & Coding",
            shortName: "Billing & Coding",
            color: programPalette.billing,
          },
          {
            name: "Limited Scope Radiology",
            shortName: "Radiology",
            color: programPalette.radiology,
          },
          {
            name: "Medical Assistant",
            shortName: "Medical Assistant",
            color: programPalette.assistant,
          },
        ])
        .returning();
      const p = Object.fromEntries(programs.map((item) => [item.shortName, item.id]));

      const employers = await tx
        .insert(employersTable)
        .values([
          {
            name: "Northside Pharmacy",
            type: "Independent pharmacy",
            location: "Austin, TX",
            website: "https://northsidepharmacy.example",
            status: "active",
            primaryContact: "Maya Patel",
            primaryEmail: "maya@northsidepharmacy.example",
            lastContacted: "2026-08-21",
            nextFollowUp: "2026-08-28",
            notes: "Consistently hires certified technicians from our program.",
          },
          {
            name: "Harborview Medical Center",
            type: "Hospital",
            location: "Austin, TX",
            website: "https://harborview.example",
            status: "active",
            primaryContact: "Jordan Lee",
            primaryEmail: "jordan.lee@harborview.example",
            lastContacted: "2026-08-18",
            nextFollowUp: "2026-09-02",
            notes: "Hiring across outpatient and clinical support teams.",
          },
          {
            name: "BrightPath Revenue Cycle",
            type: "Revenue cycle services",
            location: "Remote",
            website: "https://brightpath.example",
            status: "prospect",
            primaryContact: "Elena Garcia",
            primaryEmail: "elena@brightpath.example",
            lastContacted: "2026-08-12",
            nextFollowUp: "2026-08-27",
            notes: "Exploring an internship-to-hire pipeline.",
          },
          {
            name: "Metro Radiology Partners",
            type: "Imaging center",
            location: "Round Rock, TX",
            website: "https://metroradiology.example",
            status: "active",
            primaryContact: "Chris Morgan",
            primaryEmail: "chris@metroradiology.example",
            lastContacted: "2026-08-20",
            nextFollowUp: "2026-09-05",
            notes: "Prefers candidates with evening availability.",
          },
        ])
        .returning();
      const e = Object.fromEntries(employers.map((item) => [item.name, item.id]));

      await tx.insert(employerProgramsTable).values([
        { employerId: e["Northside Pharmacy"], programId: p.Pharmacy },
        { employerId: e["Harborview Medical Center"], programId: p["Medical Assistant"] },
        { employerId: e["Harborview Medical Center"], programId: p.Pharmacy },
        { employerId: e["Harborview Medical Center"], programId: p["Billing & Coding"] },
        { employerId: e["BrightPath Revenue Cycle"], programId: p["Billing & Coding"] },
        { employerId: e["Metro Radiology Partners"], programId: p.Radiology },
      ]);

      const jobs = await tx
        .insert(jobsTable)
        .values([
          {
            title: "Certified Pharmacy Technician",
            employerId: e["Northside Pharmacy"],
            location: "Austin, TX",
            schedule: "Full-time · Day shift",
            pay: "$20–24/hr",
            description: "Support prescription fulfillment, inventory, and patient service.",
            status: "open",
            postedDate: "2026-08-22",
            expiresDate: "2026-09-21",
            applicants: 3,
          },
          {
            title: "Medical Assistant — Family Practice",
            employerId: e["Harborview Medical Center"],
            location: "Austin, TX",
            schedule: "Full-time · Monday–Friday",
            pay: "$21–25/hr",
            description: "Room patients, support providers, and coordinate follow-up care.",
            status: "shared",
            postedDate: "2026-08-19",
            expiresDate: "2026-09-18",
            applicants: 5,
          },
          {
            title: "Remote Coding Specialist",
            employerId: e["BrightPath Revenue Cycle"],
            location: "Remote · Texas",
            schedule: "Full-time · Flexible",
            pay: "$22–27/hr",
            description: "Review claims and apply ICD-10 and CPT coding standards.",
            status: "open",
            postedDate: "2026-08-24",
            expiresDate: "2026-09-24",
            applicants: 1,
          },
          {
            title: "Limited Scope X-Ray Technician",
            employerId: e["Metro Radiology Partners"],
            location: "Round Rock, TX",
            schedule: "Full-time · Evening shift",
            pay: "$24–29/hr",
            description: "Perform routine radiographic exams in an outpatient imaging setting.",
            status: "open",
            postedDate: "2026-08-23",
            expiresDate: "2026-09-23",
            applicants: 2,
          },
        ])
        .returning();
      const j = Object.fromEntries(jobs.map((item) => [item.title, item.id]));

      await tx.insert(jobProgramsTable).values([
        { jobId: j["Certified Pharmacy Technician"], programId: p.Pharmacy },
        { jobId: j["Medical Assistant — Family Practice"], programId: p["Medical Assistant"] },
        { jobId: j["Remote Coding Specialist"], programId: p["Billing & Coding"] },
        { jobId: j["Limited Scope X-Ray Technician"], programId: p.Radiology },
      ]);

      await tx.insert(graduatesTable).values([
        {
          name: "Avery Johnson",
          email: "avery.johnson@example.com",
          phone: "(512) 555-0142",
          programId: p.Pharmacy,
          cohort: "Spring 2026",
          location: "Austin, TX",
          availability: "Immediately",
          skills: ["PCTB certified", "Inventory", "Patient service"],
          visibility: "opted-in",
          resumeName: "Avery-Johnson-CV.pdf",
          resumeUpdated: "2026-08-15",
          placementStatus: "seeking",
        },
        {
          name: "Priya Shah",
          email: "priya.shah@example.com",
          phone: "(512) 555-0198",
          programId: p["Medical Assistant"],
          cohort: "Summer 2026",
          location: "Austin, TX",
          availability: "2 weeks notice",
          skills: ["Vitals", "EHR", "Patient intake"],
          visibility: "opted-in",
          resumeName: "Priya-Shah-CV.pdf",
          resumeUpdated: "2026-08-21",
          placementStatus: "interviewing",
        },
        {
          name: "Marcus Williams",
          email: "marcus.williams@example.com",
          phone: "(512) 555-0111",
          programId: p["Billing & Coding"],
          cohort: "Spring 2026",
          location: "Round Rock, TX",
          availability: "Immediately",
          skills: ["ICD-10", "CPT", "Claims review"],
          visibility: "opted-in",
          resumeName: "Marcus-Williams-CV.pdf",
          resumeUpdated: "2026-08-19",
          placementStatus: "seeking",
        },
        {
          name: "Sofia Martinez",
          email: "sofia.martinez@example.com",
          phone: "(512) 555-0164",
          programId: p.Radiology,
          cohort: "Summer 2026",
          location: "Pflugerville, TX",
          availability: "Immediately",
          skills: ["Positioning", "Radiation safety", "Patient care"],
          visibility: "needs-review",
          resumeName: "Sofia-Martinez-CV.pdf",
          resumeUpdated: "2026-07-30",
          placementStatus: "seeking",
        },
        {
          name: "Noah Brown",
          email: "noah.brown@example.com",
          phone: "(512) 555-0130",
          programId: p["Medical Assistant"],
          cohort: "Fall 2025",
          location: "Austin, TX",
          availability: "Not seeking",
          skills: ["Clinical support", "EHR", "Phlebotomy"],
          visibility: "private",
          resumeName: null,
          resumeUpdated: null,
          placementStatus: "placed",
        },
      ]);

      await tx.insert(activitiesTable).values([
        {
          type: "email",
          title: "Follow-up due",
          detail: "BrightPath Revenue Cycle · follow up with Elena Garcia",
          entityId: e["BrightPath Revenue Cycle"],
          timestamp: new Date("2026-08-25T14:00:00Z"),
        },
        {
          type: "job",
          title: "New opportunity added",
          detail: "Remote Coding Specialist · BrightPath Revenue Cycle",
          entityId: j["Remote Coding Specialist"],
          timestamp: new Date("2026-08-24T16:30:00Z"),
        },
        {
          type: "graduate",
          title: "Graduate profile updated",
          detail: "Sofia Martinez · Limited Scope Radiology",
          entityId: 4,
          timestamp: new Date("2026-08-23T18:10:00Z"),
        },
        {
          type: "placement",
          title: "Placement recorded",
          detail: "Noah Brown · Medical Assistant",
          entityId: 5,
          timestamp: new Date("2026-08-22T15:45:00Z"),
        },
        {
          type: "email",
          title: "Outreach logged",
          detail: "Harborview Medical Center · Jordan Lee replied",
          entityId: e["Harborview Medical Center"],
          timestamp: new Date("2026-08-21T13:20:00Z"),
        },
      ]);
    });
  })();
  return seedPromise;
}

async function getProgramMap() {
  const rows = await db.select().from(programsTable);
  return new Map(rows.map((program) => [program.id, program]));
}

async function getEmployerProgramMap() {
  const rows = await db.select().from(employerProgramsTable);
  const map = new Map<number, number[]>();
  for (const row of rows) {
    map.set(row.employerId, [...(map.get(row.employerId) ?? []), row.programId]);
  }
  return map;
}

async function getJobProgramMap() {
  const rows = await db.select().from(jobProgramsTable);
  const map = new Map<number, number[]>();
  for (const row of rows) {
    map.set(row.jobId, [...(map.get(row.jobId) ?? []), row.programId]);
  }
  return map;
}

async function formatEmployer(id: number) {
  const employer = (await db
    .select()
    .from(employersTable)
    .where(eq(employersTable.id, id)))[0];
  if (!employer) return null;
  const programMap = await getProgramMap();
  const relationships = await getEmployerProgramMap();
  const openJobCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(jobsTable)
    .where(and(eq(jobsTable.employerId, id), eq(jobsTable.status, "open")));
  const programIds = relationships.get(id) ?? [];
  return {
    ...employer,
    programIds,
    programNames: programIds
      .map((programId) => programMap.get(programId)?.name)
      .filter((name): name is string => Boolean(name)),
    openJobs: asNumber(openJobCount[0]?.count),
  };
}

async function formatGraduate(row: typeof graduatesTable.$inferSelect) {
  const program = (await db
    .select()
    .from(programsTable)
    .where(eq(programsTable.id, row.programId)))[0];
  return {
    ...row,
    programName: program?.name ?? "Unassigned",
  };
}

async function formatJob(row: typeof jobsTable.$inferSelect) {
  const employer = (await db
    .select()
    .from(employersTable)
    .where(eq(employersTable.id, row.employerId)))[0];
  const programMap = await getProgramMap();
  const relationships = await getJobProgramMap();
  const programIds = relationships.get(row.id) ?? [];
  return {
    ...row,
    employerName: employer?.name ?? "Unknown employer",
    programIds,
    programNames: programIds
      .map((programId) => programMap.get(programId)?.name)
      .filter((name): name is string => Boolean(name)),
  };
}

router.get("/dashboard/summary", async (_req, res) => {
  await ensureSeedData();
  const [employers, jobs, graduates, activities] = await Promise.all([
    db.select().from(employersTable),
    db.select().from(jobsTable),
    db.select().from(graduatesTable),
    db.select().from(activitiesTable).orderBy(desc(activitiesTable.timestamp)).limit(10),
  ]);
  const programMap = await getProgramMap();
  const employerPrograms = await getEmployerProgramMap();
  const jobPrograms = await getJobProgramMap();
  const today = new Date().toISOString().slice(0, 10);
  const programRows = [...programMap.values()].map((program) => ({
    id: program.id,
    name: program.name,
    shortName: program.shortName,
    color: program.color,
    employerCount: employers.filter((employer) =>
      (employerPrograms.get(employer.id) ?? []).includes(program.id),
    ).length,
    graduateCount: graduates.filter((graduate) => graduate.programId === program.id).length,
    openJobCount: jobs.filter(
      (job) =>
        job.status === "open" &&
        (jobPrograms.get(job.id) ?? []).includes(program.id),
    ).length,
  }));
  const priorityJobs = await Promise.all(
    jobs
      .filter((job) => job.status === "open" || job.status === "shared")
      .sort((a, b) => b.postedDate.localeCompare(a.postedDate))
      .slice(0, 4)
      .map(formatJob),
  );
  const data = {
    employers: employers.length,
    activeEmployers: employers.filter((employer) => employer.status === "active").length,
    openJobs: jobs.filter((job) => job.status === "open" || job.status === "shared").length,
    optedInGraduates: graduates.filter((graduate) => graduate.visibility === "opted-in").length,
    followUpsDue: employers.filter(
      (employer) => employer.nextFollowUp !== null && employer.nextFollowUp <= today,
    ).length,
    placementsThisMonth: activities.filter(
      (activity) => activity.type === "placement" && activity.timestamp.toISOString().startsWith("2026-08"),
    ).length,
    programs: programRows,
    priorityJobs,
  };
  res.json(GetDashboardSummaryResponse.parse(data));
});

router.get("/activity", async (_req, res) => {
  await ensureSeedData();
  const rows = await db
    .select()
    .from(activitiesTable)
    .orderBy(desc(activitiesTable.timestamp))
    .limit(10);
  res.json(GetActivityResponse.parse(rows));
});

router.get("/programs", async (_req, res) => {
  await ensureSeedData();
  const [programs, employers, graduates, jobs, employerPrograms, jobPrograms] = await Promise.all([
    db.select().from(programsTable),
    db.select().from(employersTable),
    db.select().from(graduatesTable),
    db.select().from(jobsTable),
    db.select().from(employerProgramsTable),
    db.select().from(jobProgramsTable),
  ]);
  const data = programs.map((program) => ({
    ...program,
    employerCount: employers.filter((employer) =>
      employerPrograms.some((link) => link.employerId === employer.id && link.programId === program.id),
    ).length,
    graduateCount: graduates.filter((graduate) => graduate.programId === program.id).length,
    openJobCount: jobs.filter(
      (job) =>
        job.status === "open" &&
        jobPrograms.some((link) => link.jobId === job.id && link.programId === program.id),
    ).length,
  }));
  res.json(ListProgramsResponse.parse(data));
});

router.get("/employers", async (req, res) => {
  await ensureSeedData();
  const params = ListEmployersQueryParams.parse(req.query);
  const [rows, relationships, programMap] = await Promise.all([
    db.select().from(employersTable),
    getEmployerProgramMap(),
    getProgramMap(),
  ]);
  const openJobs = await db
    .select({ employerId: jobsTable.employerId, count: sql<number>`count(*)::int` })
    .from(jobsTable)
    .where(eq(jobsTable.status, "open"))
    .groupBy(jobsTable.employerId);
  const openJobsMap = new Map(openJobs.map((row) => [row.employerId, asNumber(row.count)]));
  const data = rows
    .filter((row) => {
      const programIds = relationships.get(row.id) ?? [];
      const haystack = `${row.name} ${row.type} ${row.location} ${row.primaryContact ?? ""}`.toLowerCase();
      return (
        (!params.search || haystack.includes(params.search.toLowerCase())) &&
        (!params.programId || programIds.includes(params.programId))
      );
    })
    .map((row) => {
      const programIds = relationships.get(row.id) ?? [];
      return {
        ...row,
        programIds,
        programNames: programIds
          .map((programId) => programMap.get(programId)?.name)
          .filter((name): name is string => Boolean(name)),
        openJobs: openJobsMap.get(row.id) ?? 0,
      };
    });
  return res.json(ListEmployersResponse.parse(data));
});

router.post("/employers", async (req, res) => {
  await ensureSeedData();
  const body = CreateEmployerBody.parse(req.body);
  const { programIds, ...fields } = body;
  const employer = (await db
    .insert(employersTable)
    .values({
      ...insertEmployerSchema.parse({
        ...fields,
        nextFollowUp: asDateString(body.nextFollowUp),
      }),
    })
    .returning())[0];
  if (!employer) return res.status(500).json({ error: "Unable to create employer" });
  if (programIds.length > 0) {
    await db.insert(employerProgramsTable).values(
      programIds.map((programId) => ({ employerId: employer.id, programId })),
    );
  }
  const data = await formatEmployer(employer.id);
  return res.status(201).json(GetEmployerResponse.parse(data));
});

router.get("/employers/:id", async (req, res) => {
  await ensureSeedData();
  const params = GetEmployerParams.parse(req.params);
  const data = await formatEmployer(params.id);
  if (!data) return res.status(404).json({ error: "Employer not found" });
  return res.json(GetEmployerResponse.parse(data));
});

router.patch("/employers/:id", async (req, res) => {
  await ensureSeedData();
  const params = GetEmployerParams.merge(UpdateEmployerParams).parse(req.params);
  const body = UpdateEmployerBody.parse(req.body);
  const { programIds, ...fields } = body;
  const updated = (await db
    .update(employersTable)
    .set({
      ...insertEmployerSchema.parse({
        ...fields,
        nextFollowUp: asDateString(body.nextFollowUp),
      }),
    })
    .where(eq(employersTable.id, params.id))
    .returning())[0];
  if (!updated) return res.status(404).json({ error: "Employer not found" });
  await db
    .delete(employerProgramsTable)
    .where(eq(employerProgramsTable.employerId, params.id));
  if (programIds.length > 0) {
    await db.insert(employerProgramsTable).values(
      programIds.map((programId) => ({ employerId: params.id, programId })),
    );
  }
  const data = await formatEmployer(params.id);
  return res.json(GetEmployerResponse.parse(data));
});

router.get("/graduates", async (req, res) => {
  await ensureSeedData();
  const params = ListGraduatesQueryParams.parse(req.query);
  const rows = await db.select().from(graduatesTable).orderBy(desc(graduatesTable.createdAt));
  const programMap = await getProgramMap();
  const data = rows
    .filter((row) => {
      const program = programMap.get(row.programId);
      const haystack = `${row.name} ${row.email} ${row.location} ${(row.skills ?? []).join(" ")}`.toLowerCase();
      return (
        (!params.search || haystack.includes(params.search.toLowerCase())) &&
        (!params.programId || row.programId === params.programId) &&
        (!params.visibility || row.visibility === params.visibility)
      );
    })
    .map((row) => ({
      ...row,
      programName: programMap.get(row.programId)?.name ?? "Unassigned",
    }));
  return res.json(ListGraduatesResponse.parse(data));
});

router.post("/graduates", async (req, res) => {
  await ensureSeedData();
  const body = CreateGraduateBody.parse(req.body);
  const graduate = (await db
    .insert(graduatesTable)
    .values({
      ...insertGraduateSchema.parse({
        ...body,
      }),
    })
    .returning())[0];
  if (!graduate) return res.status(500).json({ error: "Unable to create graduate" });
  return res.status(201).json((await formatGraduate(graduate)) as unknown);
});

router.patch("/graduates/:id", async (req, res) => {
  await ensureSeedData();
  const params = UpdateGraduateParams.parse(req.params);
  const body = UpdateGraduateBody.parse(req.body);
  const graduate = (await db
    .update(graduatesTable)
    .set(
      insertGraduateSchema.parse({
        ...body,
      }),
    )
    .where(eq(graduatesTable.id, params.id))
    .returning())[0];
  if (!graduate) return res.status(404).json({ error: "Graduate not found" });
  return res.json((await formatGraduate(graduate)) as unknown);
});

router.get("/jobs", async (req, res) => {
  await ensureSeedData();
  const params = ListJobsQueryParams.parse(req.query);
  const rows = await db.select().from(jobsTable).orderBy(desc(jobsTable.postedDate));
  const [employers, programMap, relationships] = await Promise.all([
    db.select().from(employersTable),
    getProgramMap(),
    getJobProgramMap(),
  ]);
  const employerMap = new Map(employers.map((employer) => [employer.id, employer]));
  const data = rows
    .filter((row) => {
      const programIds = relationships.get(row.id) ?? [];
      const haystack = `${row.title} ${employerMap.get(row.employerId)?.name ?? ""} ${row.location} ${row.schedule}`.toLowerCase();
      return (
        (!params.search || haystack.includes(params.search.toLowerCase())) &&
        (!params.programId || programIds.includes(params.programId)) &&
        (!params.status || row.status === params.status)
      );
    })
    .map((row) => {
      const programIds = relationships.get(row.id) ?? [];
      return {
        ...row,
        employerName: employerMap.get(row.employerId)?.name ?? "Unknown employer",
        programIds,
        programNames: programIds
          .map((programId) => programMap.get(programId)?.name)
          .filter((name): name is string => Boolean(name)),
      };
    });
  return res.json(ListJobsResponse.parse(data));
});

router.post("/jobs", async (req, res) => {
  await ensureSeedData();
  const body = CreateJobBody.parse(req.body);
  const { programIds, ...fields } = body;
  const job = (await db
    .insert(jobsTable)
    .values({
      ...insertJobSchema.parse({
        ...fields,
        expiresDate: asDateString(body.expiresDate),
      }),
      postedDate: new Date().toISOString().slice(0, 10),
    })
    .returning())[0];
  if (!job) return res.status(500).json({ error: "Unable to create job" });
  if (programIds.length > 0) {
    await db.insert(jobProgramsTable).values(
      programIds.map((programId) => ({ jobId: job.id, programId })),
    );
  }
  return res.status(201).json((await formatJob(job)) as unknown);
});

router.patch("/jobs/:id", async (req, res) => {
  await ensureSeedData();
  const params = UpdateJobParams.parse(req.params);
  const body = UpdateJobBody.parse(req.body);
  const { programIds, ...fields } = body;
  const job = (await db
    .update(jobsTable)
    .set(
      insertJobSchema.parse({
        ...fields,
        expiresDate: asDateString(body.expiresDate),
      }),
    )
    .where(eq(jobsTable.id, params.id))
    .returning())[0];
  if (!job) return res.status(404).json({ error: "Job not found" });
  await db.delete(jobProgramsTable).where(eq(jobProgramsTable.jobId, params.id));
  if (programIds.length > 0) {
    await db.insert(jobProgramsTable).values(
      programIds.map((programId) => ({ jobId: params.id, programId })),
    );
  }
  return res.json((await formatJob(job)) as unknown);
});

router.get("/jobs/:id/matches", async (req, res) => {
  await ensureSeedData();
  const params = GetJobMatchesParams.parse(req.params);
  const job = (await db.select().from(jobsTable).where(eq(jobsTable.id, params.id)))[0];
  if (!job) return res.status(404).json({ error: "Job not found" });
  const relationships = await getJobProgramMap();
  const programIds = relationships.get(job.id) ?? [];
  const graduates = await db
    .select()
    .from(graduatesTable)
    .where(
      and(
        eq(graduatesTable.visibility, "opted-in"),
        inArray(graduatesTable.programId, programIds.length > 0 ? programIds : [-1]),
      ),
    );
  const data = await Promise.all(graduates.map(formatGraduate));
  return res.json(GetJobMatchesResponse.parse(data));
});

export default router;