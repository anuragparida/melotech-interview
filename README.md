# MeloTech - Music Submission Platform

A modern web application for music artists to submit their tracks and for administrators to review and manage submissions. Built with React, TypeScript, Supabase, and deployed on Coolify.

## 🎵 Features

- **Artist Dashboard**: Submit music tracks with metadata (genre, BPM, key, description)
- **Admin Dashboard**: Review, rate, and provide feedback on submissions
- **Real-time Updates**: WebSocket integration for live submission updates (unavailable due to deployment issues for backend)
- **File Upload**: Secure audio file storage with Supabase Storage
- **Authentication**: Role-based access control (Artist/Admin)
- **Responsive Design**: Modern UI with Tailwind CSS and Radix UI components

## 🏗️ Architecture

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: FastAPI (optional, currently frontend-only deployment)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage for audio files
- **Authentication**: Supabase Auth
- **Deployment**: Coolify with Docker
- **Styling**: shadcn/ui + Tailwind CSS + Radix UI

## 📋 Prerequisites

- Node.js 18+ and pnpm
- Python 3.11+ (for backend development)
- Supabase account
- Coolify server (for deployment)

## 🚀 Setup and Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd melotech
```

### 2. Frontend Setup

```bash
cd frontend
pnpm install
```

### 3. Backend Setup (Optional)

```bash
cd backend
pip install -r requirements.txt
```

### 4. Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend Configuration (if using backend)
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_mailgun_domain
MAILGUN_FROM_EMAIL=noreply@yourdomain.com
WEBHOOK_SECRET=your_webhook_secret
```

### 5. Development

```bash
# Frontend development
cd frontend
pnpm dev

# Backend development (optional)
cd backend
uvicorn main:app --reload
```

## 🔧 Environment Variables Documentation

### Frontend Variables

| Variable                 | Description                                       | Required |
| ------------------------ | ------------------------------------------------- | -------- |
| `VITE_SUPABASE_URL`      | Your Supabase project URL                         | Yes      |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key for client-side operations | Yes      |

### Backend Variables (Optional)

| Variable                    | Description                                          | Required |
| --------------------------- | ---------------------------------------------------- | -------- |
| `SUPABASE_URL`              | Your Supabase project URL                            | Yes      |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key for server-side operations | Yes      |
| `MAILGUN_API_KEY`           | Mailgun API key for email notifications              | Yes      |
| `MAILGUN_DOMAIN`            | Your Mailgun domain                                  | Yes      |
| `MAILGUN_FROM_EMAIL`        | Email address for outgoing notifications             | Yes      |
| `WEBHOOK_SECRET`            | Secret for webhook signature verification            | Yes      |

## 🗄️ Database Schema

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  authid UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  instagram TEXT,
  soundcloud TEXT,
  spotify TEXT,
  biography TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Submissions Table

```sql
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userid UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  genre TEXT NOT NULL,
  bpm INTEGER NOT NULL,
  key TEXT NOT NULL,
  description TEXT NOT NULL,
  files TEXT[] NOT NULL, -- Array of file URLs
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-review', 'approved', 'rejected')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  feedback TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Storage Bucket

- **Bucket Name**: `melotechaudio`
- **Purpose**: Store uploaded audio files
- **Structure**: `{user_id}/{timestamp}-{filename}`
- **Access**: Private with signed URLs

## 🚀 Deployment

### Coolify Deployment

1. **Connect Repository**: Link your Git repository to Coolify
2. **Set Build Pack**: Choose "Dockerfile"
3. **Configure Environment Variables**: Add all required environment variables
4. **Set Domain**: Configure your domain (e.g., `melotech.anuragparida.com`)
5. **Deploy**: Click deploy and monitor the build logs

### Docker Configuration

The project includes a `Dockerfile` that:

- Builds the React frontend with Vite
- Serves the application with nginx
- Handles client-side routing
- Optimizes for production

## 📁 Project Structure

```
melotech/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   │   ├── admin/      # Admin dashboard pages
│   │   │   └── artist/     # Artist dashboard pages
│   │   ├── lib/            # Utilities and configurations
│   │   │   ├── hooks/      # Custom React hooks
│   │   │   └── supabaseutils/ # Supabase API utilities
│   │   └── assets/         # Static assets
│   ├── public/             # Public assets
│   └── package.json        # Frontend dependencies
├── backend/                # FastAPI backend (optional)
│   ├── routes/            # API routes
│   ├── services/          # Business logic services
│   ├── handlers/          # Request handlers
│   ├── models/            # Data models
│   └── requirements.txt   # Python dependencies
├── Dockerfile             # Docker configuration
├── .dockerignore          # Docker ignore file
└── README.md             # This file
```

## 🎯 User Roles

### Artist

- Submit music tracks with metadata
- View submission history and status
- Update profile information
- Listen to submitted tracks

### Admin

- Review all submissions
- Update submission status (pending, in-review, approved, rejected)
- Rate submissions (1-10 scale)
- Provide feedback
- Real-time dashboard updates

## 🔐 Authentication Flow

1. Users sign in with email/password via Supabase Auth
2. User role is determined by `admin` flag in users table
3. Artists are redirected to `/artist` dashboard
4. Admins are redirected to `/admin` dashboard
5. All API calls are authenticated via Supabase client

**MeloTech** - Empowering music creators through technology 🎵
