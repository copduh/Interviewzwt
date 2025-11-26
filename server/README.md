# InterviewPrep MERN Backend

This is a minimal Express + MongoDB backend created to replace Supabase in the InterviewPrep AI project.

## Setup

 - Copy `.env.example` to `.env` and fill in values (MONGODB_URI, JWT_SECRET, GROQ_API_KEY, ASSEMBLYAI_API_KEY).
- Install dependencies

```bash
cd server
npm install
```

- Run the server in dev mode

```bash
npm run dev
```

The server runs by default on port 4000.

## Endpoints
- `POST /api/auth/register` -> { email, password, fullName } -> returns { token, user }
- `POST /api/auth/login` -> { email, password } -> returns { token, user }
- `GET /api/auth/me` -> returns { user }
- `GET /api/job-roles` -> returns { jobRoles }
- `GET /api/job-roles/:id` -> returns { jobRole }
- `POST /api/interview-sessions` -> creates session { jobRoleId } -> returns { session }
- `PATCH /api/interview-sessions/:id` -> update session -> returns { session }
- `POST /api/functions/analyze-resume` -> calls AI to analyze resume -> returns { score, feedback }
- `POST /api/functions/voice-interview` -> perform transcription/generation -> returns { transcript } or { message }
- `POST /api/upload` -> upload files (multipart), protected
- `GET /api/profile/me` -> returns user profile
- `PATCH /api/profile/credits` -> update credits
- `POST /api/custom-job` -> create custom job description

***
