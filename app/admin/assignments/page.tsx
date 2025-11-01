'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

interface AssignmentItem {
  id: string
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED'
  createdAt: string
  validFrom: string
  validUntil: string
  mock: { id: string; title: string; description: string | null }
  student: { id: string; name: string | null; email: string }
  _count: { submissions: number }
}

export default function AdminAssignmentsPage() {
  const [items, setItems] = useState<AssignmentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'all' | 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED'>('all')

  useEffect(() => {
    fetchList()
  }, [])

  const fetchList = async (query?: string, st?: string) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      if (st && st !== 'all') params.set('status', st)
      const url = `/api/admin/assignments${params.toString() ? `?${params.toString()}` : ''}`
      const res = await fetch(url)
      const data = await res.json()
      if (res.ok) setItems(data.assignments)
      else setError(data.error || 'Failed to load assignments')
    } catch (e) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => items, [items])

  const formatDate = (s: string) => new Date(s).toLocaleString()

  const statusPill = (s: AssignmentItem['status']) => {
    switch (s) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800'
      case 'EXPIRED':
        return 'bg-red-100 text-red-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this assignment?')) return
    try {
      const res = await fetch(`/api/admin/assignments/${id}`, { method: 'DELETE' })
      if (res.ok) setItems(prev => prev.filter(i => i.id !== id))
      else {
        const d = await res.json()
        alert(d.error || 'Failed to remove')
      }
    } catch {
      alert('Network error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">Assignments</h2>
          <p className="mt-1 text-sm text-gray-500">View, filter, and manage all student assignments.</p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 gap-2">
          <Link href="/admin/students" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Assign to Student</Link>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/></svg>
            </div>
            <div className="ml-3"><h3 className="text-sm font-medium text-red-800">Error</h3><div className="mt-2 text-sm text-red-700">{error}</div></div>
          </div>
        </div>
      )}

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Search</label>
            <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') fetchList(q, status) }} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Title, student name or email" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select value={status} onChange={e => { const v = e.target.value as typeof status; setStatus(v); fetchList(q, v) }} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
              <option value="all">All</option>
              <option value="PENDING">Pending</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={() => fetchList(q, status)} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Apply</button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments found</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting filters, or assign a mock test to a student.</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filtered.map(a => (
              <li key={a.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusPill(a.status)}`}>{a.status}</span>
                        <h3 className="text-sm font-medium text-gray-900 truncate">{a.mock.title}</h3>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{a.mock.description}</p>
                      <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                        <span>Student: {a.student.name || a.student.email}</span>
                        <span>Created: {formatDate(a.createdAt)}</span>
                        <span>Valid: {formatDate(a.validFrom)} → {formatDate(a.validUntil)}</span>
                        <span>Submissions: {a._count.submissions}</span>
                      </div>
                    </div>
                    <div className="ml-4 flex items-center gap-2">
                      <Link href={`/admin/students/${a.student.id}/assignments`} className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50">Open</Link>
                      <button onClick={() => handleDelete(a.id)} className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-sm font-medium rounded text-red-700 bg-white hover:bg-red-50">Remove</button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}


