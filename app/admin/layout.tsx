import React from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';

export const metadata = {
  title: 'Tapyy Admin Portal — Super Admin Control',
  description: 'Manage businesses, issue physical NFC & QR cards, and monitor customer reviews.',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col md:flex-row text-gray-900">
      <AdminSidebar />
      <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}

