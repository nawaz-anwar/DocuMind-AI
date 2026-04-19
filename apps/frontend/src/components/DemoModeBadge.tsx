export default function DemoModeBadge() {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
        <span className="text-xs font-medium text-yellow-800">Demo Mode Active</span>
      </div>
      <div className="group relative">
        <svg 
          className="w-3.5 h-3.5 text-yellow-600 cursor-help" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
        
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          <div className="space-y-2">
            <p className="font-semibold">System is fully operational</p>
            <p className="text-gray-300">
              All features are working. Live AI responses require API billing configuration.
            </p>
            <p className="text-gray-400 text-[10px] mt-2">
              Configure OpenAI, AWS Bedrock, or Google Gemini to enable real-time responses.
            </p>
          </div>
          {/* Arrow */}
          <div className="absolute top-full right-4 -mt-1">
            <div className="w-2 h-2 bg-gray-900 transform rotate-45" />
          </div>
        </div>
      </div>
    </div>
  );
}
