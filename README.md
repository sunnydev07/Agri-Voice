# 🌾 Agri-Voice — AI-Powered Smart Farming Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

**Agri-Voice** is an AI-powered smart farming platform designed for modern agriculture. It provides farmers with voice-assisted AI guidance, real-time mandi market rates, AI crop disease scanning, weather insights, micro-payments, and a community hub for peer-to-peer collaboration.

---

## ✨ Key Features

- 🎙️ **Multilingual Voice Assistant**: Voice-activated AI powered by Google Gemini for real-time agricultural Q&A in local languages.
- 🔬 **AI Crop Disease Scanner**: Instant vision-based crop disease diagnosis with actionable treatment and prevention plans.
- 📊 **Real-Time Mandi Prices**: Live market price lookup with search, filtering, and Mandi API fallbacks.
- 🌦️ **Location-Aware Weather Insights**: Hyper-local weather forecasting with OpenWeatherMap & Open-Meteo fallbacks.
- 📰 **Agri News & Market Feed**: Geolocation-tailored agricultural news updates.
- 🤝 **Farmer Community Hub**: Peer-to-peer chat, micro-loans, WebRTC voice calls, and secure transaction tracking.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **AI Core**: Google Gemini API (Text & Vision)
- **UI & Styling**: React 19, Tailwind CSS, Lucide Icons
- **Integrations**: OpenWeatherMap, Open-Meteo, Mandi Data API, WebRTC

---

## 🚦 Quick Start

### 1. Installation

```bash
git clone https://github.com/sunnydev07/Agri-Voice.git
cd Agri-Voice
npm install --legacy-peer-deps
```

### 2. Environment Setup

Create `.env.local` in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key
WEATHER_API_KEY=your_openweathermap_key
DATA_GOV_API_KEY=your_data_gov_key
NEWS_API_KEY=your_news_api_key
```

### 3. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗺️ Key Application Routes

| Route | Purpose |
|---|---|
| `/` | Main Dashboard & Activity Summary |
| `/voice-assistant` | Multilingual AI Voice Assistant |
| `/disease-scanner` | Visual Crop Disease Diagnostic Tool |
| `/market-prices` | Live Commodity & Mandi Rate Lookup |
| `/community` | Farmer Peer-to-Peer Hub & Micro-Services |

---

## 📄 License

Distributed under the MIT License. Created by [Sunny Kumar Dev](https://github.com/sunnydev07).
