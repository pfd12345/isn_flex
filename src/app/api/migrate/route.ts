import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

const sql = neon(process.env.DATABASE_URL!);

/**
 * GET /api/migrate
 *
 * 1. Creates all database tables (idempotent — safe to call multiple times).
 * 2. If data/db.json exists (local dev), migrates its contents into PostgreSQL
 *    and renames the file to db.json.migrated to prevent re-migration.
 *
 * Call this once after setting DATABASE_URL, before first use.
 */
export async function GET() {
  try {
    // ── 1. Schema creation ──────────────────────────────────────────────────

    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS workstreams (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        owner TEXT NOT NULL,
        workflow_template_id TEXT NOT NULL,
        active_stage_id TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS workstream_stages (
        id TEXT PRIMARY KEY,
        workstream_id TEXT NOT NULL REFERENCES workstreams(id) ON DELETE CASCADE,
        stage_id TEXT NOT NULL,
        stage_name TEXT NOT NULL,
        position INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        required BOOLEAN NOT NULL DEFAULT true,
        skippable BOOLEAN NOT NULL DEFAULT false,
        parallel BOOLEAN NOT NULL DEFAULT false,
        skip_reason TEXT,
        completed_at TEXT,
        skipped_at TEXT,
        reopened_at TEXT
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        workstream_id TEXT NOT NULL REFERENCES workstreams(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        stage_id TEXT,
        created_at TEXT NOT NULL
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS artifacts (
        id TEXT PRIMARY KEY,
        workstream_id TEXT NOT NULL REFERENCES workstreams(id) ON DELETE CASCADE,
        message_id TEXT NOT NULL,
        type TEXT NOT NULL,
        data JSONB NOT NULL,
        stage_id TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        workstream_id TEXT NOT NULL REFERENCES workstreams(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        blob_url TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        stage_id TEXT,
        uploaded_at TEXT NOT NULL
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS stage_transitions (
        id TEXT PRIMARY KEY,
        workstream_id TEXT NOT NULL REFERENCES workstreams(id) ON DELETE CASCADE,
        from_stage_id TEXT,
        to_stage_id TEXT NOT NULL,
        transition_type TEXT NOT NULL,
        reason TEXT,
        performed_by TEXT,
        created_at TEXT NOT NULL
      )
    `;

    // ── 2. One-time migration from db.json ──────────────────────────────────

    const JSON_PATH = path.join(process.cwd(), 'data', 'db.json');
    const migrated: Record<string, number> = {};

    if (fs.existsSync(JSON_PATH)) {
      const raw = fs.readFileSync(JSON_PATH, 'utf-8');
      const data = JSON.parse(raw);

      // Projects
      const projects = Object.values(data.projects || {}) as Record<string, string>[];
      for (const p of projects) {
        await sql`
          INSERT INTO projects (id, name, description, created_at)
          VALUES (${p.id}, ${p.name}, ${p.description ?? ''}, ${p.created_at})
          ON CONFLICT (id) DO NOTHING
        `;
      }
      migrated.projects = projects.length;

      // Workstreams
      const workstreams = Object.values(data.workstreams || {}) as Record<string, string>[];
      for (const w of workstreams) {
        await sql`
          INSERT INTO workstreams (id, project_id, name, owner, workflow_template_id, active_stage_id, created_at)
          VALUES (
            ${w.id}, ${w.project_id}, ${w.name}, ${w.owner},
            ${w.workflow_template_id}, ${w.active_stage_id}, ${w.created_at}
          )
          ON CONFLICT (id) DO NOTHING
        `;
      }
      migrated.workstreams = workstreams.length;

      // Workstream stages (stored as workstream_id → stage[])
      let stageCount = 0;
      for (const stages of Object.values(data.workstreamStages || {})) {
        for (const s of stages as Record<string, unknown>[]) {
          await sql`
            INSERT INTO workstream_stages
              (id, workstream_id, stage_id, stage_name, position, status,
               required, skippable, parallel, skip_reason, completed_at, skipped_at, reopened_at)
            VALUES (
              ${s.id as string}, ${s.workstream_id as string}, ${s.stage_id as string},
              ${s.stage_name as string}, ${s.position as number}, ${s.status as string},
              ${Boolean(s.required)}, ${Boolean(s.skippable)}, ${Boolean(s.parallel)},
              ${(s.skip_reason as string) ?? null}, ${(s.completed_at as string) ?? null},
              ${(s.skipped_at as string) ?? null}, ${(s.reopened_at as string) ?? null}
            )
            ON CONFLICT (id) DO NOTHING
          `;
          stageCount++;
        }
      }
      migrated.workstream_stages = stageCount;

      // Messages
      let msgCount = 0;
      for (const msgs of Object.values(data.messages || {})) {
        for (const m of msgs as Record<string, unknown>[]) {
          await sql`
            INSERT INTO messages (id, workstream_id, role, content, stage_id, created_at)
            VALUES (
              ${m.id as string}, ${m.workstream_id as string}, ${m.role as string},
              ${m.content as string}, ${(m.stage_id as string) ?? null}, ${m.created_at as string}
            )
            ON CONFLICT (id) DO NOTHING
          `;
          msgCount++;
        }
      }
      migrated.messages = msgCount;

      // Artifacts
      let artifactCount = 0;
      for (const arts of Object.values(data.artifacts || {})) {
        for (const a of arts as Record<string, unknown>[]) {
          await sql`
            INSERT INTO artifacts (id, workstream_id, message_id, type, data, stage_id, status, created_at)
            VALUES (
              ${a.id as string}, ${a.workstream_id as string}, ${a.message_id as string},
              ${a.type as string}, ${JSON.stringify(a.data)}, ${(a.stage_id as string) ?? null},
              ${(a.status as string) ?? 'active'}, ${a.created_at as string}
            )
            ON CONFLICT (id) DO NOTHING
          `;
          artifactCount++;
        }
      }
      migrated.artifacts = artifactCount;

      // Files
      let fileCount = 0;
      for (const fileList of Object.values(data.files || {})) {
        for (const f of fileList as Record<string, unknown>[]) {
          await sql`
            INSERT INTO files (id, workstream_id, name, blob_url, mime_type, size_bytes, stage_id, uploaded_at)
            VALUES (
              ${f.id as string}, ${f.workstream_id as string}, ${f.name as string},
              ${f.blob_url as string}, ${f.mime_type as string}, ${f.size_bytes as number},
              ${(f.stage_id as string) ?? null}, ${f.uploaded_at as string}
            )
            ON CONFLICT (id) DO NOTHING
          `;
          fileCount++;
        }
      }
      migrated.files = fileCount;

      // Stage transitions
      let transitionCount = 0;
      for (const transitions of Object.values(data.stageTransitions || {})) {
        for (const t of transitions as Record<string, unknown>[]) {
          await sql`
            INSERT INTO stage_transitions
              (id, workstream_id, from_stage_id, to_stage_id, transition_type, reason, performed_by, created_at)
            VALUES (
              ${t.id as string}, ${t.workstream_id as string},
              ${(t.from_stage_id as string) ?? null}, ${t.to_stage_id as string},
              ${t.transition_type as string}, ${(t.reason as string) ?? null},
              ${(t.performed_by as string) ?? null}, ${t.created_at as string}
            )
            ON CONFLICT (id) DO NOTHING
          `;
          transitionCount++;
        }
      }
      migrated.stage_transitions = transitionCount;

      // Rename db.json → db.json.migrated to prevent re-migration
      fs.renameSync(JSON_PATH, JSON_PATH + '.migrated');
    }

    return NextResponse.json({
      schema: 'ok',
      migrated: Object.keys(migrated).length > 0 ? migrated : null,
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed', detail: String(error) },
      { status: 500 }
    );
  }
}
