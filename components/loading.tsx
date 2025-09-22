import { Loader } from '@/components/ai-elements/loader'

export default function Loading() {
  return (
    <div className="flex flex-col h-full items-center justify-center">
      <Loader />
      <p className="mt-4 text-muted-foreground">Loading conversation...</p>
    </div>
  )
}