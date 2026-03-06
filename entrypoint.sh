#!/bin/sh
set -e
npx prisma migrate deploy
npx prisma db seed
npx tsx server.ts
