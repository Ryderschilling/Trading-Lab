# Trading Lab

A production-ready web application for tracking and analyzing stock and options trading performance. Built with Next.js, TypeScript, PostgreSQL, and Tailwind CSS.

## Features

- 📊 **Advanced Analytics Dashboard** - Track total P&L, win rate, profit factor, and more
- 📅 **Daily P&L Calendar** - Visualize your trading performance day by day
- 🎯 **Goal Tracking** - Set and monitor personal trading goals
- 📝 **Trading Journal** - Document your trading journey with daily entries
- 🤖 **AI Trading Assistant** - Get personalized, data-driven feedback from an AI coach
- 📈 **Options Analytics** - Track performance by asset type, expiry, time of day, and day of week
- 📤 **Trade Upload** - Manual entry or CSV bulk upload
- 🔒 **Secure Authentication** - Powered by Clerk

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Styling:** Tailwind CSS + shadcn/ui
- **Charts:** Recharts
- **Authentication:** Clerk
- **AI:** OpenAI API

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Clerk account (for authentication)
- OpenAI API key (for AI assistant)

### Installation

1. **Clone the repository and install dependencies:**

```bash
npm install
```

2. **Set up environment variables:**

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/trading_lab?schema=public"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# OpenAI API
OPENAI_API_KEY=your_openai_api_key

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **Set up the database:**

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push
```

4. **Run the development server:**

```bash
npm run dev
```

5. **Open your browser:**

Navigate to [http://localhost:3000](http://localhost:3000)

## Deployment to Vercel

1. **Push your code to GitHub**

2. **Import your project to Vercel:**

   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

3. **Configure environment variables:**

   Add all the environment variables from your `.env` file in Vercel's project settings.

4. **Configure database:**

   - Use Vercel Postgres or any other PostgreSQL provider
   - Update the `DATABASE_URL` in Vercel environment variables
   - Run migrations: `npx prisma db push` (you can do this locally or in a Vercel build script)

5. **Deploy:**

   Vercel will automatically deploy your application.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard page
│   ├── upload/            # Trade upload page
│   ├── calendar/          # Calendar page
│   ├── goals/             # Goals page
│   ├── journal/           # Journal page
│   ├── analytics/         # Analytics page
│   └── assistant/         # AI Assistant page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── dashboard/        # Dashboard components
│   ├── calendar/         # Calendar components
│   ├── goals/            # Goals components
│   ├── journal/          # Journal components
│   ├── analytics/        # Analytics components
│   └── assistant/        # AI Assistant components
├── lib/                   # Utility functions
│   ├── actions/          # Server actions
│   ├── prisma.ts         # Prisma client
│   └── utils.ts          # Utility functions
└── prisma/               # Prisma schema
    └── schema.prisma     # Database schema
```

## Key Features Details

### Trade Upload

- **Manual Entry:** Fill out a comprehensive form with all trade details
- **CSV Upload:** Bulk upload trades using a downloadable template
- Automatic calculation of missing fields (total return, percent return)

### Analytics Dashboard

- Real-time KPIs (Total P&L, Win Rate, Profit Factor, etc.)
- Equity curve visualization
- Daily P&L charts
- Win/loss distribution
- Strategy performance breakdown

### Calendar View

- Monthly calendar with daily P&L visualization
- Color-coded days (green for profit, red for loss)
- Click any day to see detailed trades and journal entries
- Track win/loss streaks
- Monthly statistics summary

### Goals System

- Set custom trading goals (monthly profit, max daily loss, win rate, etc.)
- Automatic progress tracking
- Status indicators (on track, at risk, broken)
- Visual progress bars

### Trading Journal

- One entry per day
- Track pre-market plans, market bias, emotional state
- Document what went well, what went wrong, and lessons learned
- Link journal entries to calendar dates

### AI Assistant

- Personalized feedback based on your actual trading data
- Access to trades, performance stats, goals, and journal entries
- Ask questions like:
  - "What patterns are hurting my performance?"
  - "Which goals am I breaking?"
  - "What days or times should I avoid trading?"
  - "What should I focus on this week?"

## Database Schema

The application uses PostgreSQL with the following main models:

- `User` - User accounts (linked to Clerk)
- `Trade` - Individual trades
- `OptionMetadata` - Additional data for options trades
- `DailyPerformance` - Aggregated daily statistics
- `MonthlyPerformance` - Aggregated monthly statistics
- `AggregatedStats` - Overall trading statistics
- `Goal` - User-defined trading goals
- `JournalEntry` - Daily journal entries
- `AIConversationHistory` - AI assistant conversation history

## Security

- All data is user-scoped (users can only access their own data)
- Input validation on all forms
- Secure environment variables
- Authentication required for all routes (except home page)

## License

MIT

