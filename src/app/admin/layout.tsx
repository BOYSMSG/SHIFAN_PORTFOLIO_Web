import type { Metadata } from 'next';
import AdminNavHeader from './AdminNavHeader';

export const metadata: Metadata = {
  title: 'Admin Console | Mohd Shifan Gouri',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ice-50 text-midnight-900 selection:bg-electric-cyan/20 selection:text-midnight-900">
      <AdminNavHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
