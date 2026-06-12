'use client';

import React from 'react';
import { DataTable } from '@beam/ui-web';
import { ColumnDef } from '@tanstack/react-table';

type MockCoupon = {
  id: string;
  code: string;
  discount: string;
  usageLimit: string;
  status: 'Active' | 'Expired' | 'Depleted';
  expiresAt: string;
};

const mockData: MockCoupon[] = [
  { id: 'CPN-001', code: 'SUMMER20', discount: '20%', usageLimit: '45/100', status: 'Active', expiresAt: '2024-08-31' },
  { id: 'CPN-002', code: 'WELCOME500', discount: '₹500', usageLimit: 'Unlimited', status: 'Active', expiresAt: '2024-12-31' },
  { id: 'CPN-003', code: 'FLASH50', discount: '50%', usageLimit: '50/50', status: 'Depleted', expiresAt: '2024-05-01' },
  { id: 'CPN-004', code: 'WINTER10', discount: '10%', usageLimit: '120/500', status: 'Expired', expiresAt: '2024-02-28' },
];

const columns: ColumnDef<MockCoupon>[] = [
  {
    accessorKey: 'code',
    header: 'Code',
    cell: ({ row }) => (
      <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 600 }}>
        {row.original.code}
      </span>
    ),
  },
  {
    accessorKey: 'discount',
    header: 'Discount',
    cell: ({ row }) => (
      <span style={{ fontFamily: 'var(--font-mono, monospace)' }}>
        {row.original.discount}
      </span>
    ),
  },
  {
    accessorKey: 'usageLimit',
    header: 'Usage',
    cell: ({ row }) => (
      <span style={{ fontFamily: 'var(--font-mono, monospace)' }}>
        {row.original.usageLimit}
      </span>
    ),
  },
  {
    accessorKey: 'expiresAt',
    header: 'Expires At',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status;
      let color = 'var(--color-gray)';
      if (status === 'Active') color = 'var(--color-teal)';
      if (status === 'Expired') color = 'var(--color-coral, #ef4444)';
      if (status === 'Depleted') color = '#F59E0B'; // Amber
      
      return (
        <span style={{ color, fontWeight: 500 }}>
          {status}
        </span>
      );
    },
  },
];

export function CouponsTable() {
  return (
    <DataTable 
      columns={columns} 
      data={mockData} 
      onRowClick={(row) => console.log('Clicked coupon:', row.id)} 
    />
  );
}
