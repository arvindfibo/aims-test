#!/bin/bash

# Script to create local PostgreSQL database for AIMS ERP
# Usage: ./scripts/create-local-db.sh

# Database configuration (update these if needed)
DB_NAME="aims_erp_db"
DB_USER="aims_user"
DB_PASSWORD="aims_password_123"
DB_HOST="localhost"
DB_PORT="5432"

echo "🚀 Creating local PostgreSQL database..."
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo ""

# Connect to PostgreSQL as superuser and create database/user
psql -U postgres <<EOF
-- Create user if not exists
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '$DB_USER') THEN
    CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
    RAISE NOTICE 'User $DB_USER created';
  ELSE
    RAISE NOTICE 'User $DB_USER already exists';
  END IF;
END
\$\$;

-- Create database if not exists
SELECT 'CREATE DATABASE $DB_NAME OWNER $DB_USER'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

-- Connect to the new database and grant schema privileges
\c $DB_NAME
GRANT ALL ON SCHEMA public TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;

\q
EOF

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Database created successfully!"
  echo ""
  echo "📝 Add this to your .env file:"
  echo "DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME?schema=public"
  echo ""
  echo "🔧 To test the connection, run:"
  echo "psql -U $DB_USER -d $DB_NAME -h $DB_HOST -p $DB_PORT"
else
  echo ""
  echo "❌ Failed to create database. Make sure PostgreSQL is running and you have superuser access."
  echo "💡 Try: sudo -u postgres psql"
  exit 1
fi
