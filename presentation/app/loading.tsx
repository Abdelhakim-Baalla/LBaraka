export default function Loading() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-4xl px-16 space-y-8">
        <div className="space-y-4">
          <div className="shimmer h-4 w-32 rounded-full" />
          <div className="shimmer h-16 w-3/4 rounded-2xl" />
          <div className="shimmer h-6 w-1/2 rounded-xl" />
        </div>
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <div className="shimmer h-40 rounded-2xl" />
              <div className="shimmer h-4 w-2/3 rounded" />
              <div className="shimmer h-3 w-1/2 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
