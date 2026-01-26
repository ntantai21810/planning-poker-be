#!/bin/sh
set -e

echo "Regenerating Prisma client..."
npx prisma generate

echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting the application..."
exec node dist/main.js
