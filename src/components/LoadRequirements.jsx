import { useState, useRef } from 'react'

const REQUIRED_FIELDS = ['tender_id', 'tender_title', 'procuring_entity', 'bidder', 'submission_deadline', 'requirements']

function validateTender(data) {
  for (const f of REQUIRED_FIELDS) {
    if (!data[f]) return `Missing field: "${f}"`
  }
  if (!Array.isArray(data.requirements)) return '"requirements" must be an array'
  if (data.requirements.length === 0) return '"requirements" array is empty'
  for (const r of data.requirements) {
    if (!r.id || r.order == null || !r.title_en) {
      return `Requirement missing "id", "order", or "title_en": ${JSON.stringify(r)}`
    }
  }
  return null
}

export default function LoadRequirements({ onLoaded }) {
  const [error, setError] = useState(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const processFile = (file) => {
    setError(null)
    if (!file.name.endsWith('.json')) {
      setError('Please upload a JSON file (requirements.json).')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        const err = validateTender(data)
        if (err) { setError(err); return }
        // Normalize: sort requirements by order
        data.requirements = [...data.requirements].sort((a, b) => a.order - b.order)
        onLoaded(data)
      } catch {
        setError('Invalid JSON file. Please check the file and try again.')
      }
    }
    reader.readAsText(file)
  }

  const onFileInput = (e) => {
    const file = e.target.files[0]
    if (file) processFile(file)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Load Tender Requirements</h2>
        <p className="text-gray-500 mb-6 text-sm">
          Upload your <code className="bg-gray-100 px-1.5 py-0.5 rounded text-blue-700 font-mono">requirements.json</code> file
          to get started. This file defines the tender details and the list of required documents.
        </p>

        {/* Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all
            ${dragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={onFileInput}
          />
          <div className="flex flex-col items-center gap-3">
            <svg className={`w-14 h-14 ${dragging ? 'text-blue-500' : 'text-gray-300'}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <p className="text-gray-700 font-semibold">Drag & drop <span className="text-blue-600">requirements.json</span> here</p>
              <p className="text-gray-400 text-sm mt-1">or click to browse</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2 text-red-700 text-sm">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Example format hint */}
        <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Expected JSON Format</p>
          <pre className="text-xs text-gray-600 overflow-auto">{`{
  "tender_id": "T-2025-001",
  "tender_title": "Supply of Office Equipment",
  "procuring_entity": "Ministry of Finance",
  "bidder": "ABC Corporation Ltd.",
  "submission_deadline": "2025-12-31",
  "requirements": [
    {
      "id": "R01",
      "order": 1,
      "title_en": "Trade License",
      "title_bn": "ট্রেড লাইসেন্স",
      "mandatory": true,
      "has_expiry": true
    }
  ]
}`}</pre>
        </div>
      </div>
    </div>
  )
}
