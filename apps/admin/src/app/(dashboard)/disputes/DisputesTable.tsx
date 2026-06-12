'use client';

import React from 'react';
import { DataTable } from '@beam/ui-web';
import { ColumnDef } from '@tanstack/react-table';

type MockDispute = {
  id: string;
  bookingId: string;
  user: string;
  reason: string;
  status: 'Open' | 'Resolved' | 'Closed';
  date: string;
};

const mockData: MockDispute[] = [
  { id: 'DSP-101', bookingId: 'B-1002', user: 'Jane Smith', reason: 'Teacher did not show up', status: 'Open', date: '2024-05-11' },
  { id: 'DSP-102', bookingId: 'B-1004', user: 'Mike Ross', reason: 'Technical issue during session', status: 'Resolved', date: '2024-05-10' },
  { id: 'DSP-103', bookingId: 'B-1001', user: 'Sarah Parent', reason: 'Requested refund', status: 'Open', date: '2024-05-12' },
];

const columns: ColumnDef<MockDispute>[] = [
  {
    accessorKey: 'id',
    header: 'Dispute ID',
    cell: ({ row }) => (
      <span style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--color-text-secondary)' }}>
        {row.original.id}
      </span>
    ),
  },
  {
    accessorKey: 'bookingId',
    header: 'Booking ID',
    cell: ({ row }) => (
      <span style={{ fontFamily: 'var(--font-mono, monospace)' }}>
        {row.original.bookingId}
      </span>
    ),
  },
  {
    accessorKey: 'user',
    header: 'User',
  },
  {
    accessorKey: 'reason',
    header: 'Reason',
  },
  {
    accessorKey: 'date',
    header: 'Date Raised',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status;
      let color = 'var(--color-gray)';
      if (status === 'Open') color = 'var(--color-coral, #ef4444)';
      if (status === 'Resolved') color = 'var(--color-teal)';
      
      return (
        <span style={{ color, fontWeight: 500 }}>
          {status}
        </span>
      );
    },
  },
];

export function DisputesTable() {
  return (
    <DataTable 
      columns={columns} 
      data={mockData} 
      onRowClick={(row) => console.log('Clicked dispute:', row.id)} 
    />
  );
}
