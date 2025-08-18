#!/bin/bash
cd /Users/richardsurie/Documents/Development/GitHub/autokostenvergelijker.nl
git init
git remote add origin https://github.com/aitechneut/autokostenvergelijker.nl.git
git branch -M main
git add .
git commit -m "Initial commit: Complete AutoKosten Vergelijker infrastructure setup"
git push -u origin main
echo "✅ First deployment completed!"