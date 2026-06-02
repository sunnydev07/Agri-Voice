# Agri-Voice

Agri-Voice is a Next.js farming assistant dashboard focused on practical tools for farmers: crop lookup, market prices, weather insights, AI chat, disease scanning, and community interactions.

## Features

- **Dashboard home** with quick actions and farming summary cards
- **Voice Assistant** with multilingual input, speech synthesis, and image-assisted chat
- **Crop Disease Scanner** using AI image analysis and treatment/prevention guidance
- **Market Prices** view with filters, search, sorting, and fallback mandi data
- **Crop Search** with local crop database + optional OpenFarm augmentation
- **Weather Widget** with OpenWeatherMap support and Open-Meteo fallback
- **News Feed** with geolocation-aware query and fallback agriculture headlines
- **Community Hub** tabs for chat, payments, bonds, gallery, and calls

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS

## Getting Started

### 1) Install dependencies

```bash
npm install --legacy-peer-deps
```

### 2) Configure environment variables

Create a `.env.local` file in the project root:

```env
GEMINI_API_KEY=your_gemini_key
WEATHER_API_KEY=your_openweathermap_key
DATA_GOV_API_KEY=your_data_gov_key
NEWS_API_KEY=your_newsdata_key
```

> Notes:
> - `GEMINI_API_KEY` is needed for AI chat and disease scan.
> - Other keys are optional because several APIs include fallback data paths.

### 3) Run the app

```bash
npm run dev
```

Open http://localhost:3000

## Available Scripts

- `npm run dev` – start development server
- `npm run build` – create production build
- `npm run start` – run production server
- `npm run lint` – run linting (`eslint .`)

## Key Routes

- `/` – Dashboard
- `/voice-assistant` – Multilingual AI assistant
- `/disease-scanner` – Crop image diagnosis
- `/market-prices` – Mandi rates
- `/community` – Farmer community hub

## API Endpoints

- `/api/chat`
- `/api/disease-scan`
- `/api/crops`
- `/api/market-prices`
- `/api/weather`
- `/api/news`
- `/api/community/*`
