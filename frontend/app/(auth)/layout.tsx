// Minimal wrapper — each auth page controls its own layout/centering.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-shadow-grey-950">
      {children}
    </div>
  );
}
