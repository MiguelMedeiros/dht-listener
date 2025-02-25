# DHT Listener & Analyzer

A real-time monitoring system for the BitTorrent DHT (Distributed Hash Table) network with geographic node visualization.

https://github.com/user-attachments/assets/ff345733-bfcd-4e7a-bb3b-e4a554b87d39

## 🌟 Features

- **Real-time Monitoring**: Continuous tracking of active DHT nodes
- **Geographic Visualization**: Interactive map showing node locations
- **Statistical Analysis**: Detailed DHT network metrics
- **Modern Architecture**: Node.js Backend + Next.js Frontend

## 🚀 Technologies

### Backend
- Node.js
- Express
- SQLite
- bittorrent-dht
- GeoIP-lite

### Frontend
- Next.js 14
- React
- Leaflet (for maps)
- TailwindCSS
- TypeScript

## 📦 Installation

## Installing All Dependencies

Before starting the project, run the following command in the project root to install dependencies for the root, backend, and frontend:

```bash
npm run install-all
```
## How to Run the Project

Run the start script in the project root:

```bash
npm run start
```

This will start both the "backend" and "frontend" directories concurrently.


The system will be available at:
- Frontend: http://localhost:3001
- API: http://localhost:3000

## 📡 API Endpoints

- GET /nodes: General node statistics
- GET /nodes/all: Paginated list of all nodes
- GET /stats: Real-time network statistics

## 🗺️ Map Features

- Real-time DHT node visualization
- Automatic clustering for better performance
- Detailed node information on click
- Geographic distribution by country
- Automatic updates every 10 seconds

## 📊 Collected Metrics

- Total active nodes
- Geographic distribution
- Node uptime
- Appearance frequency
- Country-based statistics
