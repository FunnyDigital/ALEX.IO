#!/usr/bin/env bash
# Build the ALEX.IO web app and optionally deploy it.
set -euo pipefail
cd "$(dirname "$0")"

echo "Installing dependencies..."
npm --prefix web install --include=dev

echo "Building web app..."
npm --prefix web run build

echo ""
echo "Build complete: web/dist"
echo "Deploy options:"
echo "  1. Vercel   -> vercel --prod"
echo "  2. Netlify  -> netlify deploy --prod --dir=web/dist"
echo "  3. Firebase -> firebase deploy --only hosting"
echo "  4. Skip deploy"
read -r -p "Choose an option (1-4): " choice

case "$choice" in
  1) npx vercel --prod ;;
  2) npx netlify-cli deploy --prod --dir=web/dist ;;
  3) npx firebase-tools deploy --only hosting ;;
  *) echo "Skipping deploy." ;;
esac
