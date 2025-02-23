# DHT Listener & Analyzer

An advanced crawler and analyzer for the Mainline DHT network, implementing various BEPs (BitTorrent Enhancement Proposals) and statistical techniques for network analysis.

## 🌟 Features

- **Efficient Crawling**: Uses advanced sampling techniques to discover DHT nodes
- **Size Estimation**: Implements Mark-Recapture method with Chapman estimator
- **Geolocation**: Tracks geographical distribution of nodes
- **Real-time Analysis**: Monitors key DHT network metrics
- **Persistent Storage**: Saves historical data in SQLite for later analysis
- **REST API**: Interface for accessing collected data

## 📊 Collected Metrics

- Estimated DHT network size
- Geographical node distribution
- Most popular infohashes
- Node and peer statistics
- Node uptime
- Traffic patterns

## 🚀 Getting Started

1. **Installation**
```bash
git clone https://github.com/your-username/dht-listener
cd dht-listener
npm install
```

2. **Configuration**
```bash
cp config/bootstrap-nodes.example.json config/bootstrap-nodes.json
# Edit config/bootstrap-nodes.json with your preferred bootstrap nodes
```

3. **Running**
```bash
npm start
```

## 🌐 API Endpoints

- `GET /stats`: General network statistics
- `GET /nodes`: Detailed information about discovered nodes

## 📈 Dashboard

Access `http://localhost:3000` to see real-time statistics:
- Total network size estimation
- Node distribution heatmap
- Activity graphs
- Top infohashes

## 🔍 BEP Implementations

- BEP05: DHT Protocol
- BEP42: DHT Security Extension
- BEP43: Read-only DHT Nodes
- BEP44: Storing arbitrary data in the DHT

## 📝 Technical Notes

### Network Size Estimation
Uses Mark-Recapture method with Chapman estimator:
- Batch sampling for efficiency
- Uniformly distributed random IDs
- Minimum overlap validation
- Continuous updated estimates

### Performance Features
- Parallel DHT queries
- Efficient memory management
- Result caching
- Automatic bootstrap node reconnection

## 📜 License

MIT

## 🤝 Contributing

Contributions are welcome! Please read CONTRIBUTING.md for details on our code of conduct and pull request process.
