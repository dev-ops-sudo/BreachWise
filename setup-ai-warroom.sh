#!/bin/bash
# AI War Room Setup Checklist
# Copy & paste these commands to set up your AI War Room

echo "🚀 BreachWise AI War Room Setup"
echo "================================"
echo ""

# Step 1: Environment
echo "✓ Step 1: Create .env.local"
echo "  1. Copy .env.example to .env.local"
echo "  2. Add your Anthropic API key:"
echo "     ANTHROPIC_API_KEY=sk-ant-xxxxx"
echo ""

# Step 2: Install dependencies
echo "✓ Step 2: Install Anthropic SDK"
echo "  Run: npm install"
echo ""

# Step 3: Database
echo "✓ Step 3: Set up Supabase Database"
echo "  1. Go to: https://supabase.com/dashboard"
echo "  2. Click: SQL Editor"
echo "  3. Copy ALL content from: supabase/ai_warroom_schema.sql"
echo "  4. Paste into SQL Editor"
echo "  5. Click: Execute"
echo ""

# Step 4: Verify
echo "✓ Step 4: Verify Installation"
echo "  Run: npm run dev"
echo "  Visit: http://localhost:3000/training/simulation?attack=ransomware-network"
echo "  Click: Enter War Room (AI Mode)"
echo ""

echo "✅ Setup Complete!"
echo ""
echo "Next: Customize question prompts in src/lib/ai-warroom.ts"
echo "View: QUICKSTART_AI_WARROOM.md for features tour"
echo ""
