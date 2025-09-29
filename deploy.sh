#!/bin/bash
git add -A
git commit -m "Fix ESLint errors: escape apostrophes and remove unused imports"
git push origin main
echo "Changes pushed to repository. Vercel will auto-deploy."
