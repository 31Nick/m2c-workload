# Tech Stock Dashboard

A real-time dashboard tracking the top 20 global technology companies, built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, and **Recharts**.

![Tech Stock Dashboard - Card View](https://github.com/user-attachments/assets/e36d58d3-9099-4024-8c36-749d9c4caa56)

## Features

- 📊 **20 top tech companies** — AAPL, MSFT, GOOGL, AMZN, META, NVDA, TSLA, TSM, AVGO, ORCL, ASML, SAP, NFLX, ADBE, CRM, INTC, AMD, QCOM, TXN, IBM
- ⚡ **Near real-time updates** — auto-polls every 30 seconds with a live countdown timer
- 📈 **Two views** — responsive Card grid and sortable Table
- 🎨 **Trend sparklines** — Recharts area charts (green/red) per stock
- 🟢🔴 **Color-coded changes** — green for gains, red for losses
- 🔌 **Finnhub API integration** — live data when `FINNHUB_API_KEY` is set; realistic mock data otherwise
- 📱 **Responsive design** — works on mobile, tablet, and desktop

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Copy `.env.example` to `.env.local` and add your Finnhub API key for live data:

```
FINNHUB_API_KEY=your_finnhub_api_key_here
```

Get a free API key at [finnhub.io](https://finnhub.io). Without a key, the dashboard uses realistic simulated data.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Stock Data | Finnhub API / Mock data |
| Deployment | Vercel-ready |

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```
