'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface MockListItem {
  id: string
  title: string
  description?: string | null
  createdAt: string
  creator?: { email: string }
  modules: Array<{
    id: string
    type: 'LISTENING' | 'READING' | 'WRITING' | 'SPEAKING'
    durationMinutes: number
    questions: Array<{ id: string }>
  }>
  _count?: {
    assignments: number
  }
}

export default function AdminMocksPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mocks, setMocks] = useState<MockListItem[]>([])
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [viewTarget, setViewTarget] = useState<MockListItem | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/admin/mocks', { cache: 'no-store' })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data?.error || 'Failed to load mocks')
        }
        const data = await res.json()
        setMocks(data.mocks || [])
      } catch (e: any) {
        setError(e?.message || 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const refresh = async () => {
    try {
      const res = await fetch('/api/admin/mocks', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setMocks(data.mocks || [])
    } catch {}
  }

  const performDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/mocks/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Failed to delete')
      }
      await refresh()
    } catch (e: any) {
      setError(e?.message || 'Failed to delete')
    }
  }

  const openDeleteModal = (id: string, title: string) => {
    setDeleteTarget({ id, title })
    setDeleteModalOpen(true)
  }

  const openViewModal = (mock: MockListItem) => {
    setViewTarget(mock)
    setViewModalOpen(true)
  }


  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mock Tests</h1>
          <p className="mt-2 text-gray-600">Manage and review created mock tests</p>
        </div>
        <Link
          href="/admin/mocks/create"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create Test
        </Link>
      </div>

      {loading && (
        <div className="bg-white shadow rounded-lg p-6">Loading...</div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Modules
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assignments
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mocks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                    No mock tests found.
                  </td>
                </tr>
              ) : (
                mocks.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{m.title}</div>
                      {m.description && (
                        <div className="text-sm text-gray-500 line-clamp-1">{m.description}</div>
                      )}
                      {m.creator?.email && (
                        <div className="mt-1 text-xs text-gray-400">by {m.creator.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {new Date(m.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {m.modules.map((mod) => (
                          <span key={mod.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                            {mod.type}
                            <span className="ml-1 text-blue-400">({mod.questions?.length || 0})</span>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {m._count?.assignments ?? 0}
                    </td>
                    <td className="px-6 py-4 text-right space-x-4">
                      <button
                        type="button"
                        className="text-green-600 hover:text-green-800 text-sm"
                        onClick={() => openViewModal(m)}
                      >
                        View
                      </button>
                      <Link
                        href={`/admin/mocks/${m.id}/edit`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        className="text-red-600 hover:text-red-800 text-sm"
                        onClick={() => openDeleteModal(m.id, m.title)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* View Modal */}
      {viewModalOpen && viewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-gray-900/50" onClick={() => setViewModalOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Mock Test Details</h3>
              <p className="mt-1 text-sm text-gray-500">View mock test information and modules</p>
            </div>
            <div className="px-6 py-5 space-y-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900">{viewTarget.title}</h4>
                {viewTarget.description && (
                  <p className="mt-2 text-sm text-gray-600">{viewTarget.description}</p>
                )}
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Created:</span>
                    <span className="ml-2 text-gray-600">{new Date(viewTarget.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Assignments:</span>
                    <span className="ml-2 text-gray-600">{viewTarget._count?.assignments ?? 0}</span>
                  </div>
                  {viewTarget.creator?.email && (
                    <div className="col-span-2">
                      <span className="font-medium text-gray-700">Created by:</span>
                      <span className="ml-2 text-gray-600">{viewTarget.creator.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h5 className="text-md font-medium text-gray-900 mb-4">Modules</h5>
                <div className="space-y-4">
                  {viewTarget.modules.map((module) => (
                    <div key={module.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          {module.type}
                        </span>
                        <span className="text-sm text-gray-500">{module.durationMinutes} minutes</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Questions: {module.questions?.length || 0}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex items-center justify-end rounded-b-lg">
              <button
                type="button"
                className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                onClick={() => setViewModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-gray-900/50" onClick={() => setDeleteModalOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Delete mock test</h3>
              <p className="mt-1 text-sm text-gray-500">This action cannot be undone.</p>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-700">
                Are you sure you want to delete <span className="font-semibold">{deleteTarget.title}</span>?
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex items-center justify-end space-x-3 rounded-b-lg">
              <button
                type="button"
                className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                onClick={() => setDeleteModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                onClick={async () => {
                  await performDelete(deleteTarget.id)
                  setDeleteModalOpen(false)
                  setDeleteTarget(null)
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


