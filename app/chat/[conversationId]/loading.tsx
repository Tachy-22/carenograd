import React from 'react'
import { Loader } from '@/components/ai-elements/loader'

const loading = () => {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] items-center justify-center max-w-4xl mx-auto w-full px-4">
      <div className="flex flex-col items-center space-y-4">
        <Loader size={24} className="text-gray-600" />
        <p className="text-gray-600 text-sm">Loading messages...</p>
      </div>
    </div>
  )
}

export default loading