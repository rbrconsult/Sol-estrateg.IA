

## Plan: Backfill `status_projeto` and `closer_nome` in `sol_propostas`

### Current State
- `sol_propostas`: 1,081 records, **0** with `status_projeto`, **632** without `closer_nome`
- `sol_projetos_sync`: has the data, joins on `project_id` — **1,817 matching rows**
- Sort column in sync table: `ts_sync` (not `synced_at`)

### Step 1 — Migration: Backfill `status_projeto`

```sql
UPDATE sol_propostas p
SET status_projeto = sub.status_projeto
FROM (
  SELECT DISTINCT ON (project_id) project_id, status_projeto
  FROM sol_projetos_sync
  WHERE project_id IS NOT NULL AND status_projeto IS NOT NULL
  ORDER BY project_id, ts_sync DESC
) sub
WHERE p.project_id = sub.project_id
  AND p.status_projeto IS NULL;
```

### Step 2 — Migration: Backfill `closer_nome`

```sql
UPDATE sol_propostas p
SET closer_nome = sub.closer_nome
FROM (
  SELECT DISTINCT ON (project_id) project_id, closer_nome
  FROM sol_projetos_sync
  WHERE project_id IS NOT NULL AND closer_nome IS NOT NULL
  ORDER BY project_id, ts_sync DESC
) sub
WHERE p.project_id = sub.project_id
  AND p.closer_nome IS NULL;
```

### Step 3 — Verification SELECT

After both UPDATEs, run:

```sql
SELECT
  COUNT(*) as total,
  COUNT(status_projeto) as com_status,
  COUNT(closer_nome) as com_closer,
  COUNT(CASE WHEN status_projeto IN ('open','aberto') THEN 1 END) as abertos,
  COUNT(CASE WHEN status_projeto IN ('won','ganho') THEN 1 END) as ganhos,
  COUNT(CASE WHEN status_projeto IN ('lost','perdido') THEN 1 END) as perdidos
FROM sol_propostas;
```

### Technical Details
- Both UPDATEs go in a single database migration
- Uses `DISTINCT ON (project_id) ... ORDER BY ts_sync DESC` to pick the latest sync row
- No schema changes — only fills NULL values
- No frontend code changes needed — `projetoStatus.ts` already handles `open`/`lost`/`won`

