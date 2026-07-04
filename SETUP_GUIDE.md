# BreachWise AI War Room - Complete Setup Guide

## Current Status
✅ **API FULLY WORKING** - Questions generate successfully!

## What's Working
- ✅ Next.js dev server running on port 3002
- ✅ `/api/warroom/generate-questions` returns proper JSON responses
- ✅ Questions include all required fields (text, correct_answer, difficulty, topic, options)
- ✅ Fallback questions work when Groq API fails
- ✅ No authentication required (testing mode)
- ✅ Frontend loads and displays questions

## What Needs Setup
⚠️ Supabase database tables - To save question data and user answers

---

## SETUP STEPS

### Step 1: Create Supabase Tables

1. Go to https://supabase.com/dashboard
2. Click on the "BreachWise" project
3. Click "SQL Editor" in the left sidebar
4. Click "+ New Query"
5. Copy the entire SQL schema from: `supabase/ai_warroom_schema.sql`
6. Paste into the SQL editor
7. Click "Run" (or Cmd+Enter)
8. Wait for success confirmation

**SQL File Location**: 
```
c:\Users\dm790\OneDrive\Desktop\BreachWise\supabase\ai_warroom_schema.sql
```

### Step 2: Verify Tables Created

1. In Supabase, click "Table Editor"
2. Confirm these tables exist:
   - war_room_sessions
   - war_room_questions
   - war_room_answers
   - war_room_rankings
   - war_room_ai_chats

### Step 3: Restart Dev Server

```powershell
# In PowerShell, press Ctrl+C to stop current server
# Then run:
npm run dev
```

---

## TESTING THE API

### Test 1: Ransomware Scenario (3 questions)
```powershell
powershell -File test-api.ps1
```

Expected output:
```
Status: 200
Question Details:
  - What is the first step in incident response?
    Difficulty: easy | Topic: incident-response
    Correct Answer: Detect and analyze the incident
  ...
```

### Test 2: Phishing Scenario (5 questions)
```powershell
powershell -File test-api-phishing.ps1
```

### Test 3: Via Browser

1. Go to http://localhost:3002/training/simulation?attack=ransomware
2. Scroll down to "Enter War Room (AI Mode)" button
3. Click it
4. Questions should load and display
5. Try answering a question
6. Answer should be saved to database (after tables are created)

---

## API ENDPOINT REFERENCE

### Generate Questions
```
POST /api/warroom/generate-questions

Body:
{
  "scenarioName": "Ransomware Attack",
  "scenarioDescription": "A ransomware strain has been detected...",
  "attackType": "ransomware",
  "numberOfQuestions": 12
}

Response (200):
{
  "questions": [
    {
      "id": "q1",
      "question_text": "What is the first step...",
      "correct_answer": "Detect and analyze the incident",
      "difficulty": "easy",
      "topic": "incident-response",
      "options": [
        {"id": "a", "text": "Contain the threat"},
        {"id": "b", "text": "Detect and analyze the incident"},
        ...
      ]
    },
    ...
  ]
}
```

---

## FEATURES WORKING NOW

### ✅ Question Generation
- [x] API returns questions
- [x] Multiple difficulty levels
- [x] Multiple topics
- [x] All 4 options for each question
- [x] Correct answer provided

### ✅ Frontend Display
- [x] Questions render in browser
- [x] 15-second timer works
- [x] Answer input field active
- [x] Question counter displays
- [x] Difficulty badges show
- [x] Topic labels display

### 🔄 Answer Submission (Needs DB)
- [ ] Save to war_room_answers table
- [ ] Evaluate correctness
- [ ] Show next question
- [ ] Track progress

### 🔄 Rankings (Needs DB)
- [ ] Calculate accuracy
- [ ] Generate strengths/weaknesses
- [ ] Show overall rank

---

## PRODUCTION CHANGES NEEDED

### 1. Re-enable Authentication

File: `src/app/api/warroom/generate-questions/route.ts` (lines 59-65)

Change from:
```typescript
// Note: Auth check removed for testing. Re-enable in production.
// const supabase = await createClient();
// ...
```

To:
```typescript
const supabase = await createClient();
const {
  data: { user },
} = await supabase.auth.getUser();

if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### 2. Re-enable Login UI

File: `src/components/AIEnhancedWarRoom.tsx` (around line 482)

Uncomment the "Log In to Continue" link section

### 3. Update Groq Model (if needed)

Check Supabase documentation for available models and update:
```typescript
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
```

---

## TROUBLESHOOTING

### "Failed to generate questions"
1. Check if dev server is running on port 3002
2. Verify Groq API key in .env
3. Check browser console for detailed error
4. Fallback questions should still load

### "Error submitting answer"
1. Run Supabase schema SQL
2. Check table names match exactly
3. Restart dev server
4. Clear browser cache

### Questions don't save to database
1. Verify war_room_sessions table exists
2. Verify war_room_questions table exists
3. Check user_id is valid
4. Check RLS policies are enabled

---

## FILES TO CHECK

| File | Purpose |
|------|---------|
| `src/app/api/warroom/generate-questions/route.ts` | Question generation API |
| `src/components/AIEnhancedWarRoom.tsx` | Main UI component |
| `src/lib/supabase/war-room-db.ts` | Database operations |
| `supabase/ai_warroom_schema.sql` | Database schema (RUN IN SUPABASE!) |
| `.env.local` | Environment variables |
| `test-api.ps1` | API testing script |
| `test-api-phishing.ps1` | API testing script |

---

## NEXT MILESTONE

Once Supabase schema is created:
1. ✅ Questions persist in database
2. ✅ Answers are saved and evaluated
3. ✅ Rankings calculated and displayed
4. ✅ AI guidance works without DB errors
5. ✅ Full end-to-end simulation working
