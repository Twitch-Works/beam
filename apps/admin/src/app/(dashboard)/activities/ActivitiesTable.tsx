'use client';

import React from 'react';
import { DataTable } from '@beam/ui-web';
import { ColumnDef } from '@tanstack/react-table';

type MockActivity = {
  id: string;
  title: string;
  category: string;
  ageGroup: string;
  status: 'Published' | 'Draft' | 'Archived';
  price: string;
};

const mockData: MockActivity[] = [
  { id: 'A-001', title: 'Math Foundations', category: 'Academics', ageGroup: '5-7 years', status: 'Published', price: '₹1200' },
  { id: 'A-002', title: 'Art Class', category: 'Creative', ageGroup: '8-12 years', status: 'Draft', price: '₹800' },
  { id: 'A-003', title: 'Coding for Kids', category: 'Technology', ageGroup: '10-14 years', status: 'Published', price: '₹2000' },
  { id: 'A-004', title: 'Science Lab', category: 'Academics', ageGroup: '7-9 years', status: 'Archived', price: '₹1500' },
];

const columns: ColumnDef<MockActivity>[] = [
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => (
      <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>
        {row.original.title}
      </span>
    ),
  },
  {
    accessorKey: 'category',
    header: 'Category',
  },
  {
    accessorKey: 'ageGroup',
    header: 'Age Group',
  },
  {
    accessorKey: 'price',
    header: 'Price',
    cell: ({ row }) => (
      <span style={{ fontFamily: 'var(--font-mono, monospace)' }}>
        {row.original.price}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status;
      let color = 'var(--color-gray)';
      if (status === 'Published') color = 'var(--color-teal)';
      if (status === 'Draft') color = '#F59E0B'; // Amber
      
      return (
        <span style={{ color, fontWeight: 500 }}>
          {status}
        </span>
      );
    },
  },
];

export function ActivitiesTable() {
  return (
    <DataTable 
      columns={columns} 
      data={mockData} 
      onRowClick={(row) => console.log('Clicked activity:', row.id)} 
    />
  );
}
