import React from 'react';
import AdminShell from '@/components/admin/AdminShell';

export const metadata = {
  title: 'Tapyy Admin Portal — Super Admin Control',
  description: 'Manage businesses, issue physical NFC & QR cards, and monitor customer reviews.',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}

