#!/bin/bash

# Supabase Table-by-Table Import Script
# Imports each SQL file one-by-one in dependency order with prompts
# Retries tables that fail due to foreign key constraints

set -e

# Configuration - Target DB
TARGET_HOST="127.0.0.1"
TARGET_PORT="5432"
TARGET_USER="postgres"
TARGET_DB="postgres"
TARGET_PASSWORD="NjZaUPh4SKupJO6Hle0X5jrJ7iBdOfqGMKeYZJFu8X4="

# Remove all user prompts and automate the process
# Maintain two logs: one for FK constraint errors, one for successful imports
FK_ERROR_LOG="fk_constraint_errors.log"
SUCCESS_LOG="import_success.log"
> "$FK_ERROR_LOG"
> "$SUCCESS_LOG"

cd backups

echo "Starting table-by-table import to local database..."
echo "Target: $TARGET_HOST"
echo "Time: $(date)"
echo ""

if [ ! -f import_order.txt ]; then
  echo "Error: import_order.txt not found. Please run export-script.sh first."
  exit 1
fi

# Read list of tables into array
mapfile -t TABLES < import_order.txt
MAX_RETRY=3
ATTEMPT=1

while [ $ATTEMPT -le $MAX_RETRY ]; do
  echo ""
  echo "🔁 Import Attempt #$ATTEMPT"

  NEXT_RETRY=()

  for TABLE in "${TABLES[@]}"; do
    FILE="${TABLE}.sql"

    if [ ! -f "$FILE" ]; then
      echo "⚠️  Skipping: $FILE not found."
      continue
    fi

    echo ""
    echo "Importing table: $TABLE from $FILE"

    # Check if table exists
    TABLE_EXISTS=$(PGPASSWORD=$TARGET_PASSWORD psql \
      --host=$TARGET_HOST \
      --port=$TARGET_PORT \
      --username=$TARGET_USER \
      --dbname=$TARGET_DB \
      --tuples-only \
      --no-align \
      --command="SELECT to_regclass('public.\"${TABLE}\"');")

    if [[ "$TABLE_EXISTS" != *"$TABLE"* ]]; then
      echo "Table $TABLE does not exist — creating and importing..."
    else
      echo "⚠️  Table $TABLE already exists. Dropping and re-importing."
      PGPASSWORD=$TARGET_PASSWORD psql \
        --host=$TARGET_HOST \
        --port=$TARGET_PORT \
        --username=$TARGET_USER \
        --dbname=$TARGET_DB \
        --command="DROP TABLE IF EXISTS public.\"${TABLE}\" CASCADE;"
    fi

    LOG_FILE="import_${TABLE}.log"
    echo "📥 Importing $FILE..."
    PGPASSWORD=$TARGET_PASSWORD psql \
      --host=$TARGET_HOST \
      --port=$TARGET_PORT \
      --username=$TARGET_USER \
      --dbname=$TARGET_DB \
      --file="$FILE" >"$LOG_FILE" 2>&1

    # Only retry if constraint errors are found
    if grep -E -q "violates foreign key constraint|violates unique constraint|violates check constraint" "$LOG_FILE"; then
      echo "❌ Import had constraint errors for $TABLE (see $LOG_FILE)."
      echo "$TABLE" >> "$FK_ERROR_LOG"
      NEXT_RETRY+=("$TABLE")
      continue
    else
      echo "✅ Imported: $TABLE"
      echo "$TABLE" >> "$SUCCESS_LOG"
    fi
  done

  if [ ${#NEXT_RETRY[@]} -eq 0 ]; then
    echo "🎉 All tables imported successfully!"
    break
  elif [ ${#NEXT_RETRY[@]} -eq ${#TABLES[@]} ]; then
    echo "❌ No progress made in attempt $ATTEMPT. Exiting."
    echo "Failed tables (see $FK_ERROR_LOG):"
    printf '%s\n' "${NEXT_RETRY[@]}"
    exit 1
  else
    echo "🔄 Retrying skipped tables..."
    TABLES=("${NEXT_RETRY[@]}")
  fi

  ((ATTEMPT++))
done

echo ""
echo "✅ Final import completed after $ATTEMPT attempt(s)."
echo ""
echo "--- Import Success Log ---"
cat "$SUCCESS_LOG"
echo ""
echo "--- FK Constraint Error Log ---"
cat "$FK_ERROR_LOG"
