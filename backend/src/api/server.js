import express from 'express';
import { getNodeStats, getPaginatedNodes } from '../utils/database.js';

export function startServer(statsData, db) {
    return new Promise((resolve, reject) => {
        try {
            const app = express();
            
            // Basic configuration
            app.use(express.json());
            app.use(express.urlencoded({ extended: true }));
            
            // Complete CORS
            app.use((req, res, next) => {
                res.header('Access-Control-Allow-Origin', '*');
                res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
                res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
                next();
            });

            // Test/health check route
            app.get('/', (req, res) => {
                res.json({ status: 'ok', uptime: statsData.uptime });
            });

            // Stats endpoint with more information
            app.get('/stats', (req, res) => {
                try {
                    const stats = {
                        status: 'ok',
                        timestamp: new Date().toISOString(),
                        metrics: {
                            currentNodes: statsData.currentNodes || 0,
                            estimatedSize: statsData.estimatedSize || 0,
                            uptime: statsData.uptime || '0s',
                        },
                        topInfohashes: Array.from(statsData.topInfohashes || [])
                            .slice(0, 10)
                            .map(([hash, count]) => ({ hash, count }))
                    };
                    res.json(stats);
                } catch (err) {
                    console.error('Error in /stats:', err);
                    res.status(500).json({ 
                        error: 'Failed to get stats',
                        message: err.message 
                    });
                }
            });

            // Nodes summary endpoint with more details
            app.get('/nodes', async (req, res) => {
                try {
                    const nodeStats = await getNodeStats(db);
                    if (!nodeStats) {
                        return res.status(404).json({ error: 'No data available' });
                    }

                    res.json({
                        status: 'ok',
                        timestamp: new Date().toISOString(),
                        stats: nodeStats
                    });
                } catch (err) {
                    console.error('Error in /nodes:', err);
                    res.status(500).json({ 
                        error: 'Failed to get node stats',
                        message: err.message 
                    });
                }
            });

            // All nodes with pagination endpoint with improved validation
            app.get('/nodes/all', async (req, res) => {
                try {
                    const page = Math.max(1, parseInt(req.query.page) || 1);
                    const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit) || 50));
                    
                    const result = await getPaginatedNodes(db, page, limit);
                    if (!result) {
                        return res.status(404).json({ error: 'No nodes found' });
                    }

                    res.json({
                        status: 'ok',
                        timestamp: new Date().toISOString(),
                        data: result.nodes,
                        pagination: result.pagination
                    });
                } catch (err) {
                    console.error('Error in /nodes/all:', err);
                    res.status(500).json({ 
                        error: 'Failed to get nodes',
                        message: err.message 
                    });
                }
            });

            // Error handling middleware
            app.use((err, req, res, next) => {
                console.error('Unhandled error:', err);
                res.status(500).json({ 
                    error: 'Internal server error',
                    message: err.message 
                });
            });

            const PORT = process.env.PORT || 3000;
            const server = app.listen(PORT, () => {
                console.log(`🌐 API running on http://localhost:${PORT}`);
                console.log('Available endpoints:');
                console.log('  GET /          - Health check');
                console.log('  GET /stats     - DHT statistics');
                console.log('  GET /nodes     - Node summary');
                console.log('  GET /nodes/all - Paginated node list');
                resolve(server);
            });

            server.on('error', (err) => {
                console.error('Server error:', err);
                if (err.code === 'EADDRINUSE') {
                    console.error(`Port ${PORT} is already in use`);
                }
                reject(err);
            });

        } catch (err) {
            console.error('Failed to start server:', err);
            reject(err);
        }
    });
}