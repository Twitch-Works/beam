'use client';

import React from 'react';
import { DataTable } from '@beam/ui-web';
import { ColumnDef } from '@tanstack/react-table';

// Temporary mock data interface until we connect to the real API
type MockUser = {
  id: string;
  name: string;
  email: string;
  role: 'Parent' | 'Teacher' | 'Admin';
  status: 'Active' | 'Inactive';
  lastLogin: string;
};

const mockData: MockUser[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Parent', status: 'Active', lastLogin: '2024-05-01' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'Teacher', status: 'Active', lastLogin: '2024-05-02' },
  { id: '3', name: 'Admin User', email: 'admin@beam.com', role: 'Admin', status: 'Active', lastLogin: '2024-05-03' },
  { id: '4', name: 'Mike Ross', email: 'mike@example.com', role: 'Parent', status: 'Inactive', lastLogin: '2024-04-15' },
];

const columns: ColumnDef<MockUser>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => (
      <span className={`badge badge--${row.original.role.toLowerCase()}`}>
        {row.original.role}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <span style={{ 
        color: row.original.status === 'Active' ? 'var(--color-teal)' : 'var(--color-gray)',
        fontWeight: 500
      }}>
        {row.original.status}
      </span>
    ),
  },
  {
    accessorKey: 'lastLogin',
    header: 'Last Login',
  },
];

export function UsersTable() {
  return (
    <DataTable 
      columns={columns} 
      data={mockData} 
      onRowClick={(row) => console.log('Clicked user:', row.id)} 
    />
  );
}
