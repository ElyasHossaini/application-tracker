# AI-Powered Job Application Automation

This application automates the job application process by finding relevant job postings and generating personalized cover letters using AI.

## Features

- **User Authentication**: Secure login with Google OAuth
- **Profile Management**: Set up your professional profile and job preferences
- **Job Scraping**: Automatically find relevant jobs from LinkedIn and Indeed
- **AI Cover Letters**: Generate customized cover letters using OpenAI's GPT-4
- **Application Tracking**: Monitor your job applications and their status
- **Company Blacklist**: Maintain a list of companies to exclude from job searches

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- OpenAI API key
- Google OAuth credentials

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/auto_application?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key-here"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# OpenAI API
OPENAI_API_KEY="your-openai-api-key"
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up the database:
   ```bash
   npx prisma migrate dev
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Sign in with your Google account
2. Complete your profile with:
   - Resume upload
   - Job preferences
   - Location preferences
   - Salary requirements
3. The app will automatically search for matching jobs
4. Review and customize generated cover letters
5. Track your applications in the dashboard

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **AI**: OpenAI GPT-4
- **Job Scraping**: Puppeteer
- **Styling**: Tailwind CSS, Headless UI

## Contributing

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for your own purposes.
