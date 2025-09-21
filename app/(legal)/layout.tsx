export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen overflow-y-auto">
      {children}
    </div>
  )
}