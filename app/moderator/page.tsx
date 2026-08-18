'use client';

import { useState, useEffect } from 'react';
import { getSeededUsers } from '../lib/api';

export default function ModeratorPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const data = getSeededUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load moderator dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  const pendingUsers = users.filter((u: any) => !u.isVerified);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Moderator Dashboard</h1>
          <p className="text-slate-400">Community management and verification review</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 text-red-200 rounded-lg">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-6 rounded-lg shadow-lg">
            <p className="text-slate-200 text-sm font-semibold uppercase tracking-wide">Total Users</p>
            <p className="text-4xl font-bold text-white mt-2">{users.length}</p>
            <p className="text-slate-300 text-xs mt-2">Managed community</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 p-6 rounded-lg shadow-lg">
            <p className="text-slate-200 text-sm font-semibold uppercase tracking-wide">Pending Review</p>
            <p className="text-4xl font-bold text-white mt-2">{pendingUsers.length}</p>
            <p className="text-slate-300 text-xs mt-2">Awaiting verification</p>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-700 p-6 rounded-lg shadow-lg">
            <p className="text-slate-200 text-sm font-semibold uppercase tracking-wide">Verified Users</p>
            <p className="text-4xl font-bold text-white mt-2">{users.filter((u: any) => u.isVerified).length}</p>
            <p className="text-slate-300 text-xs mt-2">Community members</p>
          </div>
        </div>

        {/* Pending Verifications */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white">Pending Verifications</h2>
            <p className="text-slate-400 text-sm mt-1">Users awaiting review and approval</p>
          </div>

          {pendingUsers.length > 0 ? (
            <div className="divide-y divide-slate-700">
              {pendingUsers.map((user) => (
                <div key={user.id} className="p-6 hover:bg-slate-700/20 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold">
                        {user.displayName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="text-white font-medium text-lg">{user.displayName || 'Unnamed'}</p>
                        <p className="text-slate-400 text-sm">@{user.username || 'user'} · {user.email}</p>
                        <p className="text-slate-500 text-xs mt-1">Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'recently'}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition">
                        Approve
                      </button>
                      <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition">
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-slate-400">All users have been verified! 🎉</p>
            </div>
          )}
        </div>

        {/* Recent Users */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white">Recent Users</h2>
            <p className="text-slate-400 text-sm mt-1">Recently joined community members</p>
          </div>

          {users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/50">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wide">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wide">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wide">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wide">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {[...users].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10).map((user) => (
                    <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                            {user.displayName?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">{user.displayName || 'Unnamed'}</p>
                            <p className="text-slate-400 text-xs">@{user.username || 'user'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-slate-300 text-sm">{user.email || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block w-2 h-2 rounded-full ${user.isVerified ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                          <span className="text-sm font-medium text-slate-300">
                            {user.isVerified ? 'Verified' : 'Pending'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-slate-400">No users found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
