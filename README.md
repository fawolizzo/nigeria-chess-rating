# Nigerian Chess Rating System

A comprehensive tournament management and rating system for chess in Nigeria, built with React, TypeScript, and Supabase.

## 🚀 Live Application

**Production URL**: [https://nigeriachessrating.com](https://nigeriachessrating.com)

## 📋 Features

- **Tournament Management**: Create and manage chess tournaments
- **Player Registration**: Register players and manage profiles
- **Swiss Pairing System**: Automatic pairing generation for rounds
- **Result Entry**: Easy result entry and round management
- **Rating Calculation**: Nigerian Chess Rating System implementation
- **PDF Export**: Professional pairings and standings sheets
- **Mobile Responsive**: Works on all devices
- **Role-Based Access**: Tournament Organizers and Rating Officers
- **Email Confirmation**: Secure user registration with email verification
- **Password Reset**: Self-service password recovery

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **PDF Generation**: @react-pdf/renderer
- **Deployment**: Cloudflare Pages + GitHub Actions
- **Testing**: Jest, React Testing Library

## 🏗️ Project Structure

```
src/
├── features/           # Feature-based modules
│   ├── auth/          # Authentication
│   ├── tournaments/   # Tournament management
│   ├── players/       # Player management
│   ├── ratings/       # Rating calculations
│   └── pdf/           # PDF export
├── components/        # Shared UI components
├── pages/            # Page components
├── utils/            # Utility functions
└── integrations/     # External service integrations
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account (for database)

### Local Development

1. **Clone the repository**

   ```bash
   git clone <YOUR_GIT_URL>
   cd nigerian-chess-rating-system
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. **Start development server**

   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:5173
   ```

### Database Setup

1. Create a new Supabase project
2. Run the migrations in `supabase/migrations/`
3. Apply the seed data in `supabase/seed/`
4. Configure authentication settings

## 📦 Deployment

The application is automatically deployed to production using GitHub Actions and Cloudflare Pages.

### Production Deployment

1. **Set up GitHub Secrets**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`

2. **Push to main branch**:

   ```bash
   git push origin main
   ```

3. **Automatic deployment** via GitHub Actions

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Running Tests

To run unit tests, use one of the following commands:

```sh
# Run tests once
npm test

# Run tests in watch mode (recommended during development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Clearing local data

During development the application may store temporary player data in
`localStorage`. If you want to remove these entries, open the browser developer
console and run:

```js
localStorage.removeItem('ncr_players');
```

Alternatively visit `/system-testing` while running the app and use the **Clear
All Storage** button. In production builds the mock services skip loading or
storing this data by default.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Jest and React Testing Library for testing

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/58f2ba71-e798-4260-b488-27ea9520843d) and click on Share -> Publish.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)
