export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#020617] px-4">
      {/* subtle grid texture */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(#f8fafc 1px, transparent 1px), linear-gradient(90deg, #f8fafc 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* green glow */}
      <div className="pointer-events-none fixed left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-[#22c55e] opacity-[0.04] blur-[120px]" />
      <div className="relative z-10 w-full max-w-[400px]">{children}</div>
    </div>
  )
}
