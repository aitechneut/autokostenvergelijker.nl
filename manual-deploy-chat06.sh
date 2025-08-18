#!/bin/bash

# Manual deployment for Chat #06
echo "🚀 AutoKosten Vergelijker - Manual Deployment Chat #06"
echo "Deploying CSS styling + JS error handling improvements..."

cd /Users/richardsurie/Documents/Development/GitHub/autokostenvergelijker.nl

# Add all changes
git add .

# Commit changes
git commit -m "Chat #05 - CSS styling + JS error handling complete - Ready for live testing"

# Push to GitHub (which auto-deploys to live site)
git push origin main

echo "✅ Deployment completed!"
echo "🌐 Changes are now live at: https://autokostenvergelijker.nl"
echo "📝 Ready for live testing of calculator functionality"
