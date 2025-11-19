'use client'

import { useMemo, useState, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'

const TEST_TYPE_OPTIONS = ['ITEM_WISE_TEST'] as const
const QUESTION_TYPE_OPTIONS = ['FLOW_CHART_COMPLETION'] as const

type SelectOption = {
  id: string
  title: string
}

type ItemWiseTestFormValues = {
  title: string
  isActive: boolean
  testType: (typeof TEST_TYPE_OPTIONS)[number]
  questionType: (typeof QUESTION_TYPE_OPTIONS)[number]
  readingTestIds: string[]
  listeningTestIds: string[]
  writingTestIds: string[]
  moduleType: 'READING' | 'LISTENING' | 'WRITING'
}

interface ItemWiseTestFormProps {
  mode?: 'create' | 'edit'
  itemWiseTestId?: string
  initialData?: Partial<ItemWiseTestFormValues>
  readingTests: SelectOption[]
  listeningTests: SelectOption[]
  writingTests: SelectOption[]
}

export default function ItemWiseTestForm({
  mode = 'create',
  itemWiseTestId,
  initialData,
  readingTests,
  listeningTests,
  writingTests
}: ItemWiseTestFormProps) {
  const fallbackModule =
    readingTests.length > 0 ? 'READING' : listeningTests.length > 0 ? 'LISTENING' : 'WRITING'
  const computedInitialModule =
    initialData?.moduleType ||
    (initialData?.listeningTestIds && initialData.listeningTestIds.length > 0
      ? 'LISTENING'
      : initialData?.writingTestIds && initialData.writingTestIds.length > 0
      ? 'WRITING'
      : fallbackModule)

  const router = useRouter()
  const [values, setValues] = useState<ItemWiseTestFormValues>({
    title: initialData?.title ?? '',
    isActive: initialData?.isActive ?? true,
    testType: (initialData?.testType as ItemWiseTestFormValues['testType']) ?? TEST_TYPE_OPTIONS[0],
    questionType: (initialData?.questionType as ItemWiseTestFormValues['questionType']) ?? QUESTION_TYPE_OPTIONS[0],
    readingTestIds: initialData?.readingTestIds ?? [],
    listeningTestIds: initialData?.listeningTestIds ?? [],
    writingTestIds: initialData?.writingTestIds ?? [],
    moduleType: computedInitialModule
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleMultiSelectChange = (field: 'readingTestIds' | 'listeningTestIds' | 'writingTestIds') => (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedValues = Array.from(event.target.selectedOptions, (option) => option.value)
    setValues((prev) => ({
      ...prev,
      [field]: selectedValues
    }))
  }

  const handleModuleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextModule = event.target.value as ItemWiseTestFormValues['moduleType']
    setValues((prev) => ({
      ...prev,
      moduleType: nextModule,
      readingTestIds: nextModule === 'READING' ? prev.readingTestIds : [],
      listeningTestIds: nextModule === 'LISTENING' ? prev.listeningTestIds : [],
      writingTestIds: nextModule === 'WRITING' ? prev.writingTestIds : []
    }))
  }

  const moduleOptions = useMemo(() => {
    const options: Array<{ label: string; value: ItemWiseTestFormValues['moduleType']; disabled: boolean }> = [
      { label: 'Reading Tests', value: 'READING', disabled: readingTests.length === 0 },
      { label: 'Listening Tests', value: 'LISTENING', disabled: listeningTests.length === 0 },
      { label: 'Writing Tests', value: 'WRITING', disabled: writingTests.length === 0 }
    ]
    return options
  }, [readingTests.length, listeningTests.length, writingTests.length])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setMessage(null)

    if (!values.title.trim()) {
      setMessage({ type: 'error', text: 'Title is required' })
      setLoading(false)
      return
    }

    const payload = {
      ...values,
      readingTestIds: values.moduleType === 'READING' ? values.readingTestIds : [],
      listeningTestIds: values.moduleType === 'LISTENING' ? values.listeningTestIds : [],
      writingTestIds: values.moduleType === 'WRITING' ? values.writingTestIds : []
    }

    if (
      payload.moduleType === 'READING' &&
      (!payload.readingTestIds || payload.readingTestIds.length === 0)
    ) {
      setMessage({ type: 'error', text: 'Select at least one reading test.' })
      setLoading(false)
      return
    }

    if (
      payload.moduleType === 'LISTENING' &&
      (!payload.listeningTestIds || payload.listeningTestIds.length === 0)
    ) {
      setMessage({ type: 'error', text: 'Select at least one listening test.' })
      setLoading(false)
      return
    }

    if (
      payload.moduleType === 'WRITING' &&
      (!payload.writingTestIds || payload.writingTestIds.length === 0)
    ) {
      setMessage({ type: 'error', text: 'Select at least one writing test.' })
      setLoading(false)
      return
    }

    try {
      const endpoint = mode === 'edit' && itemWiseTestId
        ? `/api/admin/item-wise-tests/${itemWiseTestId}`
        : '/api/admin/item-wise-tests'
      const method = mode === 'edit' ? 'PATCH' : 'POST'

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save item-wise test')
      }

      setMessage({
        type: 'success',
        text: mode === 'edit' ? 'Item-wise test updated successfully' : 'Item-wise test created successfully'
      })

      setTimeout(() => {
        router.push('/admin/item-wise-tests')
        router.refresh()
      }, 1200)
    } catch (error) {
      console.error('Item-wise test save error:', error)
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Something went wrong'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="bg-white shadow rounded-lg p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            value={values.title}
            onChange={(event) => setValues((prev) => ({ ...prev, title: event.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter item-wise test title"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <div className="mt-2 flex items-center space-x-2">
              <input
                id="isActive"
                type="checkbox"
                checked={values.isActive}
                onChange={(event) => setValues((prev) => ({ ...prev, isActive: event.target.checked }))}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">
                Active
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Test Type</label>
            <select
              value={values.testType}
              onChange={(event) => setValues((prev) => ({ ...prev, testType: event.target.value as ItemWiseTestFormValues['testType'] }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {TEST_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Question Type</label>
            <select
              value={values.questionType}
              onChange={(event) => setValues((prev) => ({ ...prev, questionType: event.target.value as ItemWiseTestFormValues['questionType'] }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {QUESTION_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6 space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Module Type</h3>
          <p className="text-sm text-gray-500">
            Select which module this item-wise test targets. You can link only one module type at a time.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {moduleOptions.map((option) => (
            <label
              key={option.value}
              className={`flex items-center space-x-3 rounded-lg border p-3 ${
                option.disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-blue-400'
              } ${values.moduleType === option.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
            >
              <input
                type="radio"
                name="moduleType"
                value={option.value}
                disabled={option.disabled}
                checked={values.moduleType === option.value}
                onChange={handleModuleChange}
                className="text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div>
                <p className="text-sm font-semibold text-gray-900">{option.label}</p>
                {option.disabled && (
                  <p className="text-xs text-gray-500">No {option.value.toLowerCase()} tests available</p>
                )}
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900">Link Reading Tests</h3>
        {values.moduleType !== 'READING' ? (
          <p className="mt-1 text-sm text-gray-500">Switch module type to Reading to link reading tests.</p>
        ) : readingTests.length === 0 ? (
          <p className="mt-1 text-sm text-gray-500">No reading tests available. Create one first.</p>
          ) : (
          <>
            <p className="mt-1 text-sm text-gray-500">
              Select one or multiple reading tests to include in this item-wise test.
            </p>
            <div className="mt-4">
              <select
                multiple
                value={values.readingTestIds}
                onChange={handleMultiSelectChange('readingTestIds')}
                className="block w-full rounded-md border border-gray-300 bg-white p-2 focus:border-blue-500 focus:ring-blue-500"
              >
                {readingTests.map((test) => (
                  <option key={test.id} value={test.id}>
                    {test.title}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-2">
                Hold <span className="font-medium">Ctrl</span> (Windows) or <span className="font-medium">Cmd</span> (Mac) to select multiple tests.
              </p>
            </div>
          </>
        )}
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900">Link Listening Tests</h3>
        {values.moduleType !== 'LISTENING' ? (
          <p className="mt-1 text-sm text-gray-500">Switch module type to Listening to link listening tests.</p>
        ) : listeningTests.length === 0 ? (
          <p className="mt-1 text-sm text-gray-500">No listening tests available. Create one first.</p>
          ) : (
          <>
            <p className="mt-1 text-sm text-gray-500">
              Select one or multiple listening tests to include in this item-wise test.
            </p>
            <div className="mt-4">
              <select
                multiple
                value={values.listeningTestIds}
                onChange={handleMultiSelectChange('listeningTestIds')}
                className="block w-full rounded-md border border-gray-300 bg-white p-2 focus:border-blue-500 focus:ring-blue-500"
              >
                {listeningTests.map((test) => (
                  <option key={test.id} value={test.id}>
                    {test.title}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-2">
                Hold <span className="font-medium">Ctrl</span> (Windows) or <span className="font-medium">Cmd</span> (Mac) to select multiple tests.
              </p>
            </div>
          </>
          )}
        </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900">Link Writing Tests</h3>
        {values.moduleType !== 'WRITING' ? (
          <p className="mt-1 text-sm text-gray-500">Switch module type to Writing to link writing tests.</p>
        ) : writingTests.length === 0 ? (
          <p className="mt-1 text-sm text-gray-500">No writing tests available. Create one first.</p>
        ) : (
          <>
            <p className="mt-1 text-sm text-gray-500">
              Select one or multiple writing tests to include in this item-wise test.
            </p>
            <div className="mt-4">
              <select
                multiple
                value={values.writingTestIds}
                onChange={handleMultiSelectChange('writingTestIds')}
                className="block w-full rounded-md border border-gray-300 bg-white p-2 focus:border-blue-500 focus:ring-blue-500"
              >
                {writingTests.map((test) => (
                  <option key={test.id} value={test.id}>
                    {test.title}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-2">
                Hold <span className="font-medium">Ctrl</span> (Windows) or <span className="font-medium">Cmd</span> (Mac) to select multiple tests.
              </p>
            </div>
          </>
        )}
      </div>

      {message && (
        <div
          className={`rounded-md p-4 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60"
        >
          {loading ? 'Saving...' : mode === 'edit' ? 'Update Item-wise Test' : 'Create Item-wise Test'}
        </button>
      </div>
    </form>
  )
}
