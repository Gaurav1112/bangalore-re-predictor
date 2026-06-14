#!/bin/bash
set -e
cd "$(dirname "$0")/frontend"

echo "Starting Astro dev server on http://localhost:4321"
echo ""

npm run dev
