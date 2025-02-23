import crypto from 'crypto';
import os from 'os';

export function generateSecureNodeId() {
    // Get the first external IPv4 address
    const interfaces = os.networkInterfaces();
    let ip = '127.0.0.1'; // fallback to localhost
    
    for (const iface of Object.values(interfaces)) {
        for (const addr of iface) {
            if (!addr.internal && addr.family === 'IPv4') {
                ip = addr.address;
                break;
            }
        }
    }

    // Get the /24 subnet (first three octets)
    const subnet = ip.split('.').slice(0, 3).join('.');
    
    // Current time in hours since epoch
    const time = Math.floor(Date.now() / (60 * 60 * 1000));
    
    // Generate r based on IP instead of random
    const r = crypto.createHash('sha1')
        .update(ip)
        .digest()
        .slice(0, 4);
    
    // Combine subnet and time into a buffer
    const subnetBytes = Buffer.from(subnet.split('.').map(Number));
    const timeBytes = Buffer.alloc(4);
    timeBytes.writeUInt32BE(time);
    
    // Hash the combination
    const hash = crypto.createHash('sha1')
        .update(Buffer.concat([subnetBytes, timeBytes, r]))
        .digest();
    
    // Take first byte of hash as random position 'rand'
    const rand = hash[0] % 20;
    
    // Generate node ID based on the hash
    const nodeId = Buffer.alloc(20);
    
    // Copy first rand bytes from hash to nodeId
    hash.copy(nodeId, 0, 0, rand);
    
    // Copy remaining bytes from hash to nodeId
    hash.copy(nodeId, rand, rand, 20);

    return nodeId;
} 