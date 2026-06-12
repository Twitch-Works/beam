'use client';

import React from 'react';
import { DataTable } from '@beam/ui-web';
import { ColumnDef } from '@tanstack/react-table';

type MockTeacher = {
  id: string;
  name: string;
  email: string;
  verificationStatus: 'Verified' | 'Pending' | 'Rejected';
  rating: number;
  totalSessions: number;
};

const mockData: MockTeacher[] = [
  { id: 'T-001', name: 'Jane Smith', email: 'jane@example.com', verificationStatus: 'Verified', rating: 4.9, totalSessions: 120 },
  { id: 'T-002', name: 'John Doe', email: 'john.d@example.com', verificationStatus: 'Pending', rating: 0, totalSessions: 0 },
  { id: 'T-003', name: 'Mike Ross', email: 'mike@example.com', verificationStatus: 'Verified', rating: 4.7, totalSessions: 45 },
  { id: 'T-004', name: 'Emily Clark', email: 'emily@example.com', verificationStatus: 'Rejected', rating: 3.2, totalSessions: 12 },
];

const columns: ColumnDef<MockTeacher>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'verificationStatus',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.verificationStatus;
      let color = 'var(--color-gray)';
      if (status === 'Verified') color = 'var(--color-teal)';
      if (status === 'Pending') color = '#F59E0B'; // Amber
      if (status === 'Rejected') color = 'var(--color-coral, #ef4444)';
      
      return (
        <span style={{ color, fontWeight: 500 }}>
          {status}
        </span>
      );
    },
  },
  {
    accessorKey: 'rating',
    header: 'Rating',
    cell: ({ row }) => (
      <span style={{ fontFamily: 'var(--font-mono, monospace)' }}>
        {row.original.rating > 0 ? `★ ${row.original.rating.toFixed(1)}` : 'N/A'}
      </span>
    ),
  },
  {
    accessorKey: 'totalSessions',
    header: 'Sessions',
    cell: ({ row }) => (
      <span style={{ fontFamily: 'var(--font-mono, monospace)' }}>
        {row.original.totalSessions}
      </span>
    ),
  },
];

export function TeachersTable() {
  return (
    <DataTable 
      columns={columns} 
      data={mockData} 
      onRowClick={(row) => console.log('Clicked teacher:', row.id)} 
    />
  );
}
