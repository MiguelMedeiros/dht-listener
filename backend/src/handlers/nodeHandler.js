import { trackNodeLocations } from '../utils/geoip.js';
import { insertNode } from '../utils/database.js';

export function setupNodeHandler(dht, db) {
    dht.on('node', async (node) => {
        try {
            if (!node || !node.id || !node.host || !node.port) {
                console.log('⚠️ Invalid node data:', {
                    hasNode: !!node,
                    hasId: !!node?.id,
                    hasHost: !!node?.host,
                    hasPort: !!node?.port
                });
                return;
            }

            // Validate port
            if (node.port < 1 || node.port > 65535) {
                console.log('⚠️ Invalid port number:', node.port);
                return;
            }

            // Validate IP address
            if (!/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(node.host)) {
                console.log('⚠️ Invalid IP address:', node.host);
                return;
            }

            // Get geolocation data
            const geoData = trackNodeLocations(node.host);

            // Store node in database using the centralized function
            await insertNode(db, node, geoData);

            // Log new node discovery
            console.log(`🟢 NEW NODE: ID: ${node.id.toString('hex')}   Host: ${node.host.padEnd(15)}   Port: ${String(node.port).padEnd(5)}   Location: ${geoData ? `${geoData.city}, ${geoData.country}` : 'Unknown'}`);

        } catch (err) {
            console.error('❌ Error processing node:', err);
            console.error('Debug info:', { node });
        }
    });
} 