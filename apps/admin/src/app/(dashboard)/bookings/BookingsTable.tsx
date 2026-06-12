'use client';

import React from 'react';
import { DataTable } from '@beam/ui-web';
import { ColumnDef } from '@tanstack/react-table';

type MockBooking = {
  id: string;
  activity: string;
  childName: string;
  teacher: string;
  date: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled' | 'Completed';
  amount: string;
};

const mockData: MockBooking[] = [
  { id: 'B-1001', activity: 'Math Foundations', childName: 'Tommy', teacher: 'Jane Smith', date: '2024-05-10', status: 'Confirmed', amount: '₹1200' },
  { id: 'B-1002', activity: 'Art Class', childName: 'Sarah', teacher: 'John Doe', date: '2024-05-11', status: 'Pending', amount: '₹800' },
  { id: 'B-1003', activity: 'Coding for Kids', childName: 'Alex', teacher: 'Mike Ross', date: '2024-05-09', status: 'Completed', amount: '₹2000' },
  { id: 'B-1004', activity: 'Science Lab', childName: 'Emma', teacher: 'Jane Smith', date: '2024-05-12', status: 'Cancelled', amount: '₹1500' },
];

const columns: ColumnDef<MockBooking>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => (
      <span style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--color-text-secondary)' }}>
        {row.original.id}
      </span>
    ),
  },
  {
    accessorKey: 'activity',
    header: 'Activity',
  },
  {
    accessorKey: 'childName',
    header: 'Child',
  },
  {
    accessorKey: 'teacher',
    header: 'Teacher',
  },
  {
    accessorKey: 'date',
    header: 'Date',
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => (
      <span style={{ fontFamily: 'var(--font-mono, monospace)' }}>
        {row.original.amount}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status;
      let color = 'var(--color-gray)';
      if (status === 'Confirmed' || status === 'Completed') color = 'var(--color-teal)';
      if (status === 'Pending') color = '#F59E0B'; // Amber
      if (status === 'Cancelled') color = 'var(--color-coral, #ef4444)';
      
      return (
        <span style={{ color, fontWeight: 500 }}>
          {status}
        </span>
      );
    },
  },
];

export function BookingsTable() {
  return (
    <DataTable 
      columns={columns} 
      data={mockData} 
      onRowClick={(row) => console.log('Clicked booking:', row.id)} 
    />
  );
}
