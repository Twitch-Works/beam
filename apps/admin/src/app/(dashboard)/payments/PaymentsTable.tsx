'use client';

import React from 'react';
import { DataTable } from '@beam/ui-web';
import { ColumnDef } from '@tanstack/react-table';

type MockPayment = {
  id: string;
  type: 'Inbound' | 'Payout';
  user: string;
  amount: string;
  status: 'Completed' | 'Pending' | 'Failed';
  date: string;
};

const mockData: MockPayment[] = [
  { id: 'PAY-100', type: 'Inbound', user: 'Tommy Parent', amount: '₹1200', status: 'Completed', date: '2024-05-10' },
  { id: 'PAY-101', type: 'Payout', user: 'Jane Smith', amount: '₹2000', status: 'Pending', date: '2024-05-11' },
  { id: 'PAY-102', type: 'Inbound', user: 'Sarah Parent', amount: '₹800', status: 'Failed', date: '2024-05-09' },
  { id: 'PAY-103', type: 'Inbound', user: 'Emma Parent', amount: '₹1500', status: 'Completed', date: '2024-05-12' },
];

const columns: ColumnDef<MockPayment>[] = [
  {
    accessorKey: 'id',
    header: 'Transaction ID',
    cell: ({ row }) => (
      <span style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--color-text-secondary)' }}>
        {row.original.id}
      </span>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => (
      <span style={{ 
        fontWeight: 500,
        color: row.original.type === 'Inbound' ? 'var(--color-teal)' : '#6366f1'
      }}>
        {row.original.type}
      </span>
    ),
  },
  {
    accessorKey: 'user',
    header: 'User',
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => (
      <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 500 }}>
        {row.original.type === 'Payout' ? '-' : '+'}{row.original.amount}
      </span>
    ),
  },
  {
    accessorKey: 'date',
    header: 'Date',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status;
      let color = 'var(--color-gray)';
      if (status === 'Completed') color = 'var(--color-teal)';
      if (status === 'Pending') color = '#F59E0B'; // Amber
      if (status === 'Failed') color = 'var(--color-coral, #ef4444)';
      
      return (
        <span style={{ color, fontWeight: 500 }}>
          {status}
        </span>
      );
    },
  },
];

export function PaymentsTable() {
  return (
    <DataTable 
      columns={columns} 
      data={mockData} 
      onRowClick={(row) => console.log('Clicked payment:', row.id)} 
    />
  );
}
