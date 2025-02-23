import DHT from 'bittorrent-dht';
import { setupNodeHandler } from './handlers/nodeHandler.js';
import { setupStatsHandler } from './handlers/statsHandler.js';
import { generateSecureNodeId } from './utils/nodeId.js';
import { initDatabase } from './utils/database.js';
import { startServer } from './api/server.js';

export async function initDHT() {
    try {
        // Initialize database
        const db = await initDatabase();
        if (!db) {
            throw new Error('Failed to initialize database');
        }

        // Initialize DHT
        const nodeId = generateSecureNodeId();
        console.log('🔄 Starting DHT node...');
        
        const dht = new DHT({ 
            nodeId,
            verify: true,
            concurrency: 16
        });

        // Data to share with the API
        const statsData = {
            currentNodes: 0,
            uptime: '0s',
            estimatedSize: 0,
            topNodes: [],
            nodeLocations: new Map(),
            popularInfohashes: new Map(),
            topInfohashes: []
        };

        // Wait for DHT to be ready
        await new Promise((resolve) => {
            dht.on('ready', () => {
                console.log('✅ DHT is ready');
                resolve();
            });

            dht.listen(6881, () => {
                console.log('🚀 DHT node started on port 6881');
            });
        });

        // Setup handlers
        setupNodeHandler(dht, db);
        const intervals = setupStatsHandler(dht, statsData, db);

        // Start the API server
        const server = await startServer(statsData, db, dht);
        if (!server) {
            throw new Error('Failed to start API server');
        }

        // Handle graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\n📴 Shutting down...');
            clearInterval(intervals.statsInterval);
            clearInterval(intervals.discoveryInterval);
            server.close();
            dht.destroy(() => process.exit(0));
        });

    } catch (err) {
        console.error('❌ Fatal error:', err);
        process.exit(1);
    }
}

// Start the application
initDHT().catch(err => {
    console.error('Failed to initialize:', err);
    process.exit(1);
});