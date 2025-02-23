'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import 'flag-icons/css/flag-icons.min.css'

interface Node {
  node_id: string
  ip: string
  port: number
  latitude: number | null
  longitude: number | null
  city: string | null
  country: string | null
  times_seen: number
  first_seen: string
  last_seen: string
  color: string
}

interface PaginationInfo {
  total: number
  page: number
  limit: number
  pages: number
  hasMore: boolean
}

interface ApiResponse {
  status: string
  timestamp: string
  data: Node[]
  pagination: PaginationInfo
}

interface CountryDistribution {
  country: string
  count: number
}

interface Stats {
  total_nodes: number
  active_last_hour: number
  avg_times_seen: number
  max_times_seen: number
  total_historical: number
  countryDistribution: CountryDistribution[]
}

interface ApiStatsResponse {
  status: string
  timestamp: string
  stats: Stats
}

const POLLING_INTERVAL = 5000 // 5 seconds instead of 10000
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// Component to optimize marker rendering
function OptimizedMarkers({ nodes }: { nodes: Node[] }) {
  const map = useMap()
  const markersRef = useRef<{ [key: string]: L.CircleMarker }>({})
  
  useEffect(() => {
    // Clear old markers that are no longer present
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      if (!nodes.find(n => n.node_id === id)) {
        marker.remove()
        delete markersRef.current[id]
      }
    })

    // Update or create new markers
    nodes.forEach(node => {
      if (!markersRef.current[node.node_id]) {
        const marker = L.circleMarker([node.latitude!, node.longitude!], {
          radius: 6,
          fillColor: node.color,
          fillOpacity: 0.8,
          stroke: false,
          bubblingMouseEvents: false
        })
        
        const firstSeen = new Date(node.first_seen).toLocaleString()
        const lastSeen = new Date(node.last_seen).toLocaleString()
        
        const popupContent = `
          <div class="bg-gray-900 text-gray-100 p-4 rounded-lg min-w-[300px]">
            <h3 class="font-bold text-lg mb-3 text-purple-400 border-b border-gray-700 pb-2">
              ${node.city ? `${node.city}, ${node.country}` : node.country || 'Unknown location'}
            </h3>
            
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-gray-400">Node ID:</span>
                <span class="font-mono text-sm">${node.node_id.substring(0, 16)}...</span>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-gray-400">Address:</span>
                <span class="font-mono text-sm">${node.ip}:${node.port}</span>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-gray-400">Times seen:</span>
                <span class="bg-purple-500/20 px-2 py-0.5 rounded text-purple-300">
                  ${node.times_seen.toLocaleString()} times
                </span>
              </div>

              <div class="mt-4 pt-2 border-t border-gray-700/50">
                <div class="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p class="text-gray-400 mb-1">First seen:</p>
                    <p class="text-gray-300">${firstSeen}</p>
                  </div>
                  <div>
                    <p class="text-gray-400 mb-1">Last seen:</p>
                    <p class="text-gray-300">${lastSeen}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `
        
        marker.bindPopup(popupContent, {
          className: 'dark-popup',
          maxWidth: 350,
          minWidth: 300
        })
        
        marker.addTo(map)
        markersRef.current[node.node_id] = marker
      } else {
        // Update position if needed
        markersRef.current[node.node_id].setLatLng([node.latitude!, node.longitude!])
      }
    })
  }, [nodes, map])

  return null
}

// Updated function to return the flag SVG component
function getCountryFlag(countryCode: string) {
  try {
    if (!countryCode || countryCode === 'Unknown') {
      return '🌐'
    }

    // Some special codes that need handling
    const specialCases: { [key: string]: string } = {
      'XK': '🇽🇰', // Kosovo
      'EU': '🇪🇺', // European Union
    }

    if (specialCases[countryCode]) {
      return specialCases[countryCode]
    }

    // Returns the span element with the flag class
    return (
      <span 
        className={`fi fi-${countryCode.toLowerCase()}`}
        style={{ 
          display: 'inline-block',
          width: '1.5em',
          height: '1em',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: '50%',
          verticalAlign: 'middle'
        }}
      />
    )
  } catch (err) {
    console.warn(`Failed to get flag for ${countryCode}`, err)
    return '🌐'
  }
}

export default function DHTMap() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(POLLING_INTERVAL / 1000)
  const [stats, setStats] = useState<Stats | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMoreNodes, setHasMoreNodes] = useState(true)
  
  const lastUpdateRef = useRef<Date>(new Date())

  const fetchNodes = useCallback(async (page: number, isPolling = false) => {
    try {
      const response = await fetch(`${API_URL}/nodes/all?page=${page}&limit=1000`)
      if (!response.ok) throw new Error('Failed to fetch nodes')
      
      const data: ApiResponse = await response.json()
      
      const validNodes = data.data.filter(node => 
        node.latitude && node.longitude && 
        node.latitude !== 0 && node.longitude !== 0
      )

      setNodes(prev => {
        const nodesMap = new Map(prev.map(node => [node.node_id, node]))
        validNodes.forEach(node => {
          nodesMap.set(node.node_id, {
            ...node,
            color: '#BD93F9'
          })
        })
        const newNodes = Array.from(nodesMap.values())
        return newNodes
      })

      lastUpdateRef.current = new Date()
      setLastUpdate(new Date())
      setError(null)
      setHasMoreNodes(validNodes.length > 0)

      return validNodes.length > 0
    } catch (err) {
      console.error('Fetch error:', err)
      if (!isPolling) {
        setError(err instanceof Error ? err.message : 'Failed to fetch nodes')
      }
      return false
    }
  }, [])

  // Function to load initial nodes
  const loadAllHistoricalNodes = useCallback(async () => {
    await fetchNodes(1, false);
    setInitialLoadComplete(true);
    setLoading(false);
    setCurrentPage(1);
    // Force hasMoreNodes as true after initial load
    setHasMoreNodes(true);
  }, [fetchNodes]);

  // Effect to load all historical data on start
  useEffect(() => {
    loadAllHistoricalNodes()
  }, [loadAllHistoricalNodes])

  // Add function to fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/nodes`)
      if (!response.ok) throw new Error('Failed to fetch stats')
      const data: ApiStatsResponse = await response.json()
      setStats(data.stats)
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }, [])

  // Add to polling useEffect
  useEffect(() => {
    if (!initialLoadComplete) return

    fetchStats() // Fetch initial stats
    const pollInterval = setInterval(() => {
      fetchNodes(1, true) // Always polling from first page
      fetchStats()
    }, POLLING_INTERVAL)

    return () => clearInterval(pollInterval)
  }, [fetchNodes, fetchStats, initialLoadComplete])

  // Separate effect for progress animation
  useEffect(() => {
    if (!initialLoadComplete) return

    const startTime = Date.now()
    const updateProgress = () => {
      const elapsed = Date.now() - startTime
      const remaining = Math.ceil((POLLING_INTERVAL - (elapsed % POLLING_INTERVAL)) / 1000)
      
      setSecondsLeft(remaining)
      requestAnimationFrame(updateProgress)
    }

    const animationFrame = requestAnimationFrame(updateProgress)
    return () => cancelAnimationFrame(animationFrame)
  }, [initialLoadComplete])

  // Update loadMoreNodes function to be simpler and more robust
  const loadMoreNodes = useCallback(async () => {
    if (isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const response = await fetch(`${API_URL}/nodes/all?page=${nextPage}&limit=1000`);
      if (!response.ok) throw new Error('Failed to fetch more nodes');
      
      const data: ApiResponse = await response.json();
      
      const validNodes = data.data.filter(node => 
        node.latitude && node.longitude && 
        node.latitude !== 0 && node.longitude !== 0
      );

      setNodes(prev => {
        const nodesMap = new Map(prev.map(node => [node.node_id, node]));
        validNodes.forEach(node => {
          nodesMap.set(node.node_id, {
            ...node,
            color: '#BD93F9'
          });
        });
        const newNodes = Array.from(nodesMap.values());
        return newNodes;
      });

      setCurrentPage(nextPage);
      // Simple logic: if we received valid nodes, there are more to load
      setHasMoreNodes(validNodes.length > 0);
    } catch (err) {
      console.error('Error loading more nodes:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentPage, isLoadingMore]);

  if (loading || !initialLoadComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
        <p className="text-lg">Loading initial DHT nodes...</p>
        <p className="text-sm text-gray-400 mt-2">{nodes.length} nodes loaded</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="relative h-screen w-full">
      <MapContainer
        center={[20, 0]}
        zoom={3}
        className="h-full w-full"
        preferCanvas={true}
        minZoom={2}
        maxZoom={8}
        renderer={L.canvas()}
        maxBoundsViscosity={1.0}
      >
        <TileLayer
          attribution=''
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          updateWhenIdle={true}
          updateWhenZooming={false}
        />
        <OptimizedMarkers nodes={nodes} />
      </MapContainer>

      <div className="absolute top-4 right-4 bg-gray-800/80 backdrop-blur-sm text-white px-4 py-3 rounded-lg shadow-lg z-[1000]">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-purple-400">DHT Network Stats</h3>
            <span className="text-sm font-medium text-gray-300 w-[2ch] text-center">
              {secondsLeft}s
            </span>
          </div>

          <div className="h-px bg-gray-700 my-2"></div>

          <div className="space-y-2">
            <p className="font-medium flex items-center gap-2">
              <span>🟣</span>
              <span>{nodes.length.toLocaleString()} active nodes</span>
            </p>
            
            <p className="text-sm flex items-center gap-2 text-gray-400">
              <span>📊</span>
              <span>Total historical: {stats?.total_historical?.toLocaleString() || 0} nodes</span>
            </p>
          </div>

          <div className="text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-400">Last update:</span>
              <span className="text-gray-300">{lastUpdate.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Country distribution card with limited height */}
      <div className="absolute top-4 left-4 bg-gray-800/80 backdrop-blur-sm text-white rounded-lg shadow-lg z-[1000] max-h-[48vh] overflow-y-auto w-80">
        <div className="sticky top-0 bg-gray-800/95 backdrop-blur-sm px-4 py-3 border-b border-gray-700 z-[1]">
          <h3 className="text-lg font-bold text-purple-400">Country Distribution</h3>
          <p className="text-sm text-gray-400 mt-1">
            Active nodes by country ({stats?.countryDistribution.length || 0} countries)
          </p>
        </div>
        
        <div className="px-2 py-2 relative z-0">
          {stats?.countryDistribution.map((country) => (
            <div
              key={country.country}
              className="flex items-center justify-between px-2 py-1.5 hover:bg-gray-700/30 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-4 flex items-center justify-center">
                  {getCountryFlag(country.country)}
                </span>
                <span className="text-sm">
                  {getCountryName(country.country)}
                </span>
              </div>
              <span className="text-sm font-medium bg-purple-500/20 px-2 py-0.5 rounded text-purple-300">
                {country.count.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Load More button - Now always visible when there are more nodes */}
      {hasMoreNodes && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[1000]">
          <button
            onClick={loadMoreNodes}
            disabled={isLoadingMore}
            className={`
              px-4 py-2 rounded-lg shadow-lg
              ${isLoadingMore 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800'}
              text-white font-medium transition-colors
              backdrop-blur-sm bg-opacity-90
              flex items-center gap-2
              min-w-[160px] justify-center
            `}
          >
            <div className={`w-4 h-4 border-2 border-white/30 border-t-white rounded-full ${isLoadingMore ? 'animate-spin' : 'hidden'}`} />
            <span>{isLoadingMore ? 'Loading...' : 'Load More Nodes'}</span>
          </button>
        </div>
      )}
    </div>
  )
}

// Improved function to get country name
function getCountryName(countryCode: string) {
  try {
    if (!countryCode) return 'Unknown'
    
    // Some special names that need handling
    const specialCases: { [key: string]: string } = {
      'XK': 'Kosovo',
      'EU': 'European Union',
      'UN': 'United Nations',
      'TW': 'Taiwan',
      'HK': 'Hong Kong',
    }

    if (specialCases[countryCode]) {
      return specialCases[countryCode]
    }

    return new Intl.DisplayNames(['en'], { type: 'region' }).of(countryCode) || countryCode
  } catch {
    return countryCode
  }
} 