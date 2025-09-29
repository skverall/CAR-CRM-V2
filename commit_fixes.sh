#!/bin/bash
echo "Committing translation and icon fixes..."
git add -A
git commit -m "Fix translations and car icon

- Replace trash icon with proper car icon for total cars
- Fix mixed language issues by using proper translation keys
- Add missing translation keys for dashboard descriptions
- Update both Uzbek and Russian translations
- Ensure consistent language usage throughout the interface"
git push origin main
echo "✅ Changes pushed! Vercel will auto-deploy with fixes."
