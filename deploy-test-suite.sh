#!/bin/bash

# Deploy v1.11.1 Test Suite
echo "🚀 Deploying v1.11.1 Test Suite..."

# Navigate to GitHub directory
cd /Users/richardsurie/Documents/Development/GitHub/autokostenvergelijker.nl

# Check current status
echo "📊 Current git status:"
git status --short

# Add all files
echo "📁 Adding files..."
git add .

# Commit with descriptive message
echo "💾 Committing changes..."
git commit -m "Add v1.11.1 complete testing suite

- Add test-v1-11-1.html with comprehensive testing
- Tesla K693BS bijtelling validation
- 5 bijtelling scenario tests (EV ≤€30k, EV >€30k, Benzine post-2017, Pre-2017, Youngtimer) 
- RDW API integration testing (validation, normalization, rate limiting)
- Multiple vehicle robustness testing
- Custom kenteken interactive testing
- Real-time statistics and performance monitoring
- Ready for v1.11.1 verification before Calculator #2 development"

# Push to GitHub (triggers auto-deploy)
echo "⬆️  Pushing to GitHub..."
git push origin main

echo "✅ Deployment completed!"
echo "🌐 Test suite will be available at: https://autokostenvergelijker.nl/test-v1-11-1.html"
echo "🧪 Ready for comprehensive v1.11.1 testing"
