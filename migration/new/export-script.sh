#!/bin/bash

# Dependency-Aware Supabase Table Export Script
set -e

# Supabase source config
SOURCE_HOST="aws-0-ap-southeast-1.pooler.supabase.com"
SOURCE_PORT="6543"
SOURCE_USER="postgres.mzjcmtltwdcpbdvunmzk"
SOURCE_DB="postgres"
SOURCE_PASSWORD="d3cipl3s"

# Backup dir
mkdir -p backups
cd backups

echo "Starting dependency-ordered table export..."
echo "Time: $(date)"

# Get dependency-ordered list
TABLES=$(PGPASSWORD=$SOURCE_PASSWORD psql \
  --host=$SOURCE_HOST \
  --port=$SOURCE_PORT \
  --username=$SOURCE_USER \
  --dbname=$SOURCE_DB \
  --tuples-only \
  --no-align \
  --command="
WITH RECURSIVE fkeys AS (
  SELECT
    cl.oid AS table_oid,
    cl.relname AS table_name,
    0 AS level
  FROM pg_class cl
  JOIN pg_namespace ns ON ns.oid = cl.relnamespace
  WHERE cl.relkind = 'r' AND ns.nspname = 'public'

  UNION

  SELECT
    c.conrelid,
    cl.relname,
    fkeys.level + 1
  FROM pg_constraint c
  JOIN pg_class cl ON cl.oid = c.conrelid
  JOIN fkeys ON fkeys.table_oid = c.confrelid
  WHERE c.contype = 'f'
)
SELECT table_name
FROM fkeys
GROUP BY table_name, level
ORDER BY level, table_name;
")


# Save import order
echo "$TABLES" > import_order.txt

# Export each table
for TABLE in $TABLES; do
  echo "Exporting table: $TABLE"
  PGPASSWORD=$SOURCE_PASSWORD pg_dump \
    --host=$SOURCE_HOST \
    --port=$SOURCE_PORT \
    --username=$SOURCE_USER \
    --dbname=$SOURCE_DB \
    --no-owner \
    --no-privileges \
    --verbose \
    --file="${TABLE}.sql" \
    --table="public.${TABLE}"
done

# Table row count report
PGPASSWORD=$SOURCE_PASSWORD psql \
  --host=$SOURCE_HOST \
  --port=$SOURCE_PORT \
  --username=$SOURCE_USER \
  --dbname=$SOURCE_DB \
  --command="SELECT schemaname, tablename, n_live_tup as total_rows FROM pg_stat_user_tables WHERE schemaname = 'public' ORDER BY tablename;" \
  --output=table_counts_source_$(date +%Y%m%d_%H%M%S).txt

echo "✅ Export complete. Import order saved in import_order.txt."
