# DHT Listener & Analyzer

A real-time monitoring system for the BitTorrent DHT (Distributed Hash Table) network with geographic node visualization.

https://github.com/user-attachments/assets/ff345733-bfcd-4e7a-bb3b-e4a554b87d39

## 🌟 Features

- **Real-time Monitoring**: Continuous tracking of active DHT nodes
- **Geographic Visualization**: Interactive map showing node locations
- **Statistical Analysis**: Detailed DHT network metrics
- **Modern Architecture**: Node.js Backend + Next.js Frontend
- **Containerization**: Fully dockerized for easy deployment

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

1. Clone the repository
2. Start with Docker Compose:
   docker-compose up --build

The system will be available at:
- Frontend: http://localhost:3001
- API: http://localhost:3000

## 🔧 Manual Setup (without Docker)

### Backend
1. Navigate to backend directory
2. Run npm install
3. Start with npm start

### Frontend
1. Navigate to frontend directory
2. Run npm install
3. Start with npm run dev

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

## 🛠️ Development

To contribute to the project:

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Submit a Pull Request

## 📄 License

MIT - See LICENSE file for details

## 📞 Support

To report bugs or suggest features, please open an issue in the GitHub repository.
