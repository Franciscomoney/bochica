# Bochica - Final Implementation Guide

## 🚀 Complete Implementation Plan

This document provides the exact code needed to complete the Bochica platform.

---

## 1. Admin Dashboard

### Admin Login (`/admin`)

**Credentials**:
- Username: `admin`
- Password: `CHANGE_ME_IN_PRODUCTION`

Create `app/admin/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const router = useRouter();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch('/api/auth/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    if (res.ok) {
      router.push('/admin/dashboard');
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-xl w-96">
        <h1 className="text-2xl font-bold mb-6">Admin Login</h1>
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              required
              value={credentials.username}
              onChange={e => setCredentials({...credentials, username: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              required
              value={credentials.password}
              onChange={e => setCredentials({...credentials, password: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
```

### Admin Dashboard (`/admin/dashboard`)

Create `app/admin/dashboard/page.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalFunding: 0,
    activeLoans: 0,
    platformFees: 0,
    recentTransactions: []
  });

  useEffect(() => {
    // TODO: Fetch real data from Supabase
    // For now, mock data
    setStats({
      totalProjects: 12,
      totalFunding: 145000,
      activeLoans: 8,
      platformFees: 5800,
      recentTransactions: [
        { id: '1', type: 'commit', amount: 5000, user: '5GrwvaEF...', time: '2 hours ago' },
        { id: '2', type: 'borrow', amount: 3000, user: '5HpG9w8E...', time: '4 hours ago' },
      ]
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-indigo-600 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-indigo-100">Platform Overview & Management</p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Total Projects</div>
            <div className="text-3xl font-bold text-indigo-600">{stats.totalProjects}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Total Funding</div>
            <div className="text-3xl font-bold text-green-600">${stats.totalFunding.toLocaleString()}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Active Loans</div>
            <div className="text-3xl font-bold text-orange-600">{stats.activeLoans}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Platform Fees</div>
            <div className="text-3xl font-bold text-purple-600">${stats.platformFees.toLocaleString()}</div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">User</th>
                  <th className="pb-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentTransactions.map(tx => (
                  <tr key={tx.id} className="border-b">
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        tx.type === 'commit' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3">${tx.amount.toLocaleString()}</td>
                    <td className="py-3 font-mono text-sm">{tx.user}</td>
                    <td className="py-3 text-gray-600">{tx.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
```

### Admin Auth API (`/api/auth/admin`)

Create `app/api/auth/admin/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const { username, password } = await request.json();

  // Check credentials
  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    // Set secure cookie
    (await cookies()).set('admin-session', 'authenticated', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 86400 // 24 hours
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
}
```

---

## 2. Projects Browsing Page

Create `app/projects/page.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { useWallet } from '@/contexts/WalletContext';
import { calculateFundingPercentage } from '@/lib/financial';

export default function ProjectsPage() {
  const { isConnected } = useWallet();
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchProjects();
  }, [filter]);

  const fetchProjects = async () => {
    // TODO: Replace with real Supabase query
    const mockProjects = [
      {
        id: '1',
        title: 'Local Coffee Shop Expansion',
        description: 'Help us open our second location in downtown',
        goal_amount: 10000,
        current_funding: 3500,
        status: 'active',
        creator_address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'
      },
      {
        id: '2',
        title: 'Community Garden Project',
        description: 'Building a sustainable garden for the neighborhood',
        goal_amount: 5000,
        current_funding: 4800,
        status: 'active',
        creator_address: '5HpG9w8EBnVRbAqZ7gY4zM3XkGPvNcEwjY9RQj3TE8Qs8F9w'
      }
    ];
    setProjects(mockProjects);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Browse Projects</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-white'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg ${filter === 'active' ? 'bg-indigo-600 text-white' : 'bg-white'}`}
            >
              Active
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {projects.map(project => {
            const progress = calculateFundingPercentage(project.current_funding, project.goal_amount);
            return (
              <div key={project.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{project.title}</h3>
                  <p className="text-gray-600 mb-4">{project.description}</p>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">Progress</span>
                      <span className="text-indigo-600">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-600">${project.current_funding.toLocaleString()}</span>
                      <span className="font-medium">of ${project.goal_amount.toLocaleString()}</span>
                    </div>
                  </div>

                  <Link
                    href={`/project/${project.id}`}
                    className="block w-full text-center bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    View Details & Invest
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
            <p className="text-gray-600">Be the first to create a funding project!</p>
            <Link
              href="/create-project"
              className="inline-block mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Create Project
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
```

---

## Summary of All Files to Create

Due to token limits, I've provided the key files above. The complete implementation requires:

### Pages (17 files):
1. ✅ `app/admin/page.tsx` - Admin login
2. ✅ `app/admin/dashboard/page.tsx` - Admin dashboard
3. ✅ `app/projects/page.tsx` - Browse projects
4. ⏳ `app/create-project/page.tsx` - Create project form
5. ⏳ `app/project/[id]/page.tsx` - Project details
6. ⏳ `app/dashboard/page.tsx` - User dashboard

### API Routes (6 files):
1. ✅ `app/api/auth/admin/route.ts` - Admin auth
2. ⏳ `app/api/projects/route.ts` - CRUD projects
3. ⏳ `app/api/commitments/route.ts` - Investments
4. ⏳ `app/api/loans/route.ts` - Borrowing
5. ⏳ `app/api/repayments/route.ts` - Repayments

### Components (5 files):
1. ⏳ `components/ProjectCard.tsx`
2. ⏳ `components/InvestmentForm.tsx`
3. ⏳ `components/XcmTransferModal.tsx`

## Next Steps

1. **Restart server** to load new env vars
2. **Create remaining files** from templates above
3. **Test workflows**:
   - Admin: https://localhost:3000/admin
   - Projects: https://localhost:3000/projects
4. **Connect to Supabase** for persistence

**Admin Access**:
- URL: https://localhost:3000/admin
- Username: `admin`
- Password: `CHANGE_ME_IN_PRODUCTION`
