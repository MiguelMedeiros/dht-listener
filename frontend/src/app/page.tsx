'use client'

import dynamic from 'next/dynamic'

// Dynamic import of the map to avoid SSR issues with Leaflet
const DHTMap = dynamic(() => import('@/components/DHTMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  )
})

export default function Home() {
  return (
    <main className="min-h-screen">
      <DHTMap />
    </main>
  )
}