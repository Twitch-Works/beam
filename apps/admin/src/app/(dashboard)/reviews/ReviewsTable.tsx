'use client';

import React from 'react';
import { DataTable } from '@beam/ui-web';
import { ColumnDef } from '@tanstack/react-table';

type MockReview = {
  id: string;
  bookingId: string;
  teacher: string;
  rating: number;
  feedback: string;
  date: string;
};

const mockData: MockReview[] = [
  { id: 'REV-101', bookingId: 'B-1002', teacher: 'Jane Smith', rating: 5, feedback: 'Great session!', date: '2024-05-11' },
  { id: 'REV-102', bookingId: 'B-1004', teacher: 'Mike Ross', rating: 3, feedback: 'Okay, but started late.', date: '2024-05-10' },
  { id: 'REV-103', bookingId: 'B-1001', teacher: 'Sarah Parent', rating: 1, feedback: 'Terrible experience.', date: '2024-05-12' },
];

const columns: ColumnDef<MockReview>[] = [
  {
    accessorKey: 'id',
    header: 'Review ID',
    cell: ({ row }) => (
      <span style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--color-text-secondary)' }}>
        {row.original.id}
      </span>
    ),
  },
  {
    accessorKey: 'teacher',
    header: 'Teacher',
  },
  {
    accessorKey: 'rating',
    header: 'Rating',
    cell: ({ row }) => {
      const rating = row.original.rating;
      let color = 'var(--color-text)';
      if (rating >= 4) color = 'var(--color-teal)';
      else if (rating === 3) color = '#F59E0B'; // Amber
      else color = 'var(--color-coral, #ef4444)';
      
      return (
        <span style={{ color, fontWeight: 600 }}>
          {Array(rating).fill('★').join('')}{Array(5 - rating).fill('☆').join('')}
        </span>
      );
    },
  },
  {
    accessorKey: 'feedback',
    header: 'Feedback',
    cell: ({ row }) => (
      <span style={{ 
        maxWidth: '250px', 
        overflow: 'hidden', 
        textOverflow: 'ellipsis', 
        whiteSpace: 'nowrap',
        display: 'inline-block' 
      }}>
        {row.original.feedback}
      </span>
    ),
  },
  {
    accessorKey: 'date',
    header: 'Date',
  },
];

export function ReviewsTable() {
  return (
    <DataTable 
      columns={columns} 
      data={mockData} 
      onRowClick={(row) => console.log('Clicked review:', row.id)} 
    />
  );
}
