import { randomBytes } from 'crypto';

export class DHTNodeDiscoverer {
    constructor(dht) {
        this.dht = dht;
        this.BATCH_SIZE = 32; // Increased to discover more nodes at once
        this.discoveredNodes = new Set();
    }

    async discoverNodes() {
        console.log(`\n🔍 Starting DHT node discovery...`);
        
        try {
            // Generate random IDs for both sample sets (like before)
            const firstSetIds = Array(this.BATCH_SIZE).fill()
                .map(() => randomBytes(20));
            const secondSetIds = Array(this.BATCH_SIZE).fill()
                .map(() => randomBytes(20));
            
            // Collect samples from both sets in parallel (previous strategy)
            const [firstSetSamples, secondSetSamples] = await Promise.all([
                Promise.all(firstSetIds.map(id => this.findClosestNodes(id))),
                Promise.all(secondSetIds.map(id => this.findClosestNodes(id)))
            ]);

            // Process all discovered nodes
            const allSamples = [...firstSetSamples.flat(), ...secondSetSamples.flat()];
            
            // Filter new nodes
            const newNodes = allSamples.filter(node => {
                if (!node?.id) return false;
                const nodeId = node.id.toString('hex');
                const isNew = !this.discoveredNodes.has(nodeId);
                if (isNew) {
                    this.discoveredNodes.add(nodeId);
                }
                return isNew;
            });

            if (newNodes.length > 0) {
                console.log(`📊 Discovery Results:
    New nodes found: ${newNodes.length}
    Total unique nodes: ${this.discoveredNodes.size}
    Batch efficiency: ${(newNodes.length / (this.BATCH_SIZE * 2)).toFixed(2)} nodes/query
                `);
            }

            return newNodes;

        } catch (err) {
            console.warn('⚠️ Error during node discovery:', err);
            return [];
        }
    }

    async findClosestNodes(targetId) {
        return new Promise((resolve) => {
            let resolved = false;
            
            this.dht.lookup(targetId, (err, foundNodes) => {
                if (!resolved) {
                    resolved = true;
                    if (err) {
                        console.warn('Lookup error:', err);
                        resolve([]);
                    } else {
                        resolve(Array.isArray(foundNodes) ? foundNodes : []);
                    }
                }
            });

            // Timeout after 5 seconds
            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    resolve([]);
                }
            }, 5000);
        });
    }
}