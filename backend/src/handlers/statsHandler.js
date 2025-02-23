import { formatTimeDiff } from '../utils/formatting.js';
import { DHTNodeDiscoverer } from '../utils/dhtSize.js';

export function setupStatsHandler(dht, statsData, db) {
    let startTime = Date.now();
    const statsInterval = 2000; // 2 seconds

    // Configure interval for regular statistics
    const interval = setInterval(() => {
        try {
            // Network Statistics
            const totalNodes = countNodesInBucket(dht.nodes?.root);
            statsData.currentNodes = totalNodes;
            statsData.uptime = formatTimeDiff(startTime, Date.now());
            
            // Update stats silently without console logs
            statsData.topInfohashes = Array.from(statsData.popularInfohashes.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10);

        } catch (err) {
            console.error('❌ Error updating stats:', err);
        }
    }, statsInterval);

    const discoverer = new DHTNodeDiscoverer(dht);

    async function discoverMoreNodes() {
        try {
            console.log('\n🔍 Starting new node discovery...');
            const newNodes = await discoverer.discoverNodes();
            
            // Process and save newly found nodes
            for (const node of newNodes) {
                try {
                    // Get geolocation data
                    const geoData = trackNodeLocations(node.host);
                    // Save to database
                    await insertNode(db, node, geoData);
                } catch (nodeErr) {
                    console.error('Error processing node:', nodeErr);
                }
            }

        } catch (err) {
            console.error('\n❌ Error during discovery:', err);
        }
    }

    // Configure interval for periodic discovery
    const discoveryInterval = setInterval(discoverMoreNodes, 60 * 1000); // every 1 minute

    // Return for proper cleanup
    return { 
        statsInterval: interval, 
        discoveryInterval 
    };
}

function countNodesInBucket(bucket) {
    if (!bucket) return 0;
    let count = 0;
    if (bucket.contacts) count += bucket.contacts.length;
    if (bucket.left) count += countNodesInBucket(bucket.left);
    if (bucket.right) count += countNodesInBucket(bucket.right);
    return count;
}