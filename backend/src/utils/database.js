import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Store historical data for analysis
export async function initDatabase() {
    try {
        const db = await open({
            filename: './dht_metrics.db',
            driver: sqlite3.Database
        });

        // Create only the dht_nodes table
        await db.exec(`
            CREATE TABLE IF NOT EXISTS dht_nodes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                node_id TEXT UNIQUE,
                ip TEXT,
                port INTEGER,
                first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
                times_seen INTEGER DEFAULT 1,
                city TEXT,
                country TEXT,
                region TEXT,
                latitude REAL,
                longitude REAL
            );
        `);

        return db;
    } catch (err) {
        console.error('❌ Error initializing database:', err);
        throw err;
    }
}

// Get top nodes by times seen
export async function getTopNodes(db, limit = 10) {
    try {
        return await db.all(`
            SELECT 
                node_id,
                ip,
                port,
                city,
                country,
                times_seen,
                datetime(first_seen) as first_seen,
                datetime(last_seen) as last_seen
            FROM dht_nodes 
            ORDER BY times_seen DESC 
            LIMIT ?
        `, [limit]);
    } catch (err) {
        console.error('❌ Error getting top nodes:', err);
        return null;
    }
}

// New function to get node statistics
export async function getNodeStats(db) {
    if (!db) return null;
    
    try {
        const stats = await db.get(`
            SELECT 
                COUNT(*) as total_historical,
                COUNT(CASE WHEN datetime(last_seen) >= datetime('now', '-1 hour') THEN 1 END) as active_last_hour,
                AVG(times_seen) as avg_times_seen,
                MAX(times_seen) as max_times_seen
            FROM dht_nodes
        `);

        const countryDistribution = await db.all(`
            SELECT 
                country,
                COUNT(*) as count
            FROM dht_nodes
            WHERE country IS NOT NULL
            GROUP BY country
            ORDER BY count DESC
        `);

        return {
            total_historical: stats.total_historical,
            active_last_hour: stats.active_last_hour,
            avg_times_seen: Math.round(stats.avg_times_seen),
            max_times_seen: stats.max_times_seen,
            countryDistribution
        };
    } catch (err) {
        console.error('Error getting node stats:', err);
        return null;
    }
}

// Add or update node in database
export async function insertNode(db, node, geoData) {
    if (!db || !node) return false;

    try {
        await db.run(`
            INSERT INTO dht_nodes (
                node_id, ip, port, times_seen,
                city, country, region, latitude, longitude
            )
            VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?)
            ON CONFLICT(node_id) DO UPDATE SET
                last_seen = CURRENT_TIMESTAMP,
                times_seen = times_seen + 1,
                ip = CASE 
                    WHEN ip != excluded.ip THEN excluded.ip 
                    ELSE ip 
                END,
                port = CASE 
                    WHEN port != excluded.port THEN excluded.port 
                    ELSE port 
                END
        `, [
            node.id.toString('hex'),
            node.host,
            node.port,
            geoData?.city || null,
            geoData?.country || null,
            geoData?.region || null,
            geoData?.ll?.[0] || null,
            geoData?.ll?.[1] || null
        ]);
        return true;
    } catch (err) {
        console.error('❌ Error inserting node:', err);
        return false;
    }
}

// Function to get paginated nodes
export async function getPaginatedNodes(db, page = 1, limit = 50) {
    if (!db) return null;
    
    try {
        // Get total count for pagination, sem limite artificial
        const { total } = await db.get('SELECT COUNT(*) as count FROM dht_nodes');
        
        // Calculate offset
        const offset = (page - 1) * limit;
        
        // Get nodes for current page, ordered by last_seen DESC to get the most recent ones
        const nodes = await db.all(`
            SELECT 
                node_id,
                ip,
                port,
                city,
                country,
                region,
                latitude,
                longitude,
                times_seen,
                datetime(first_seen) as first_seen,
                datetime(last_seen) as last_seen
            FROM dht_nodes
            ORDER BY last_seen DESC
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        return {
            nodes,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
                hasMore: offset + nodes.length < total // Removida a limitação de 10000
            }
        };
    } catch (err) {
        console.error('❌ Error getting paginated nodes:', err);
        return null;
    }
} 