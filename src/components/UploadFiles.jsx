import { useState, useRef, useCallback } from 'react'
import { computeFileHash, getPdfPageCount, formatBytes } from '../utils.js'

const MAX_FILES = 30
const MAX_TOTAL_MB = 50

export default function UploadFiles({ uploadedFiles, setUploadedFiles, matches, setMatches }) {
  const [errors, setErrors] = useState([])
  const [loading, setLoading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const processFiles = useCallback(async (fileList) => {
    setErrors([])
    setLoading(true)
    const newErrors = []

    // Filter only PDFs
    const pdfs = Array.from(fileList).filter(f => {
      if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
        newErrors.push(`"${f.name}" is not a PDF — skipped.`)
        return false
      }
      return true
    })

    // Check max files
    if (uploadedFiles.length + pdfs.length > MAX_FILES) {
      newErrors.push(`Cannot exceed ${MAX_FILES} files. You tried to add ${pdfs.length} more (already have ${uploadedFiles.length}).`)
      setErrors(newErrors)
      setLoading(false)
      return
    }

    // Check total size
    const currentTotalBytes = uploadedFiles.reduce((sum, f) => sum + f.size, 0)
    const newTotalBytes = pdfs.reduce((sum, f) => sum + f.size, 0)
    if (currentTotalBytes + newTotalBytes > MAX_TOTAL_MB * 1024 * 1024) {
      newErrors.push(`Total file size would exceed ${MAX_TOTAL_MB} MB limit.`)
      setErrors(newErrors)
      setLoading(false)
      return
    }

    // Process each PDF
    const processed = []
    for (const file of pdfs) {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const [hash, pages] = await Promise.all([
          computeFileHash(arrayBuffer),
          getPdfPageCount(arrayBuffer),
        ])
        processed.push({
          id: crypto.randomUUID(),
          file,
          name: file.name,
          size: file.size,
          pages,
          hash,
          isDuplicate: false,
          duplicateOf: null, // id of the first file with same hash
        })
      } catch (err) {
        newErrors.push(`Could not read "${file.name}": ${err.message}`)
      }
    }

    // Merge with existing and detect duplicates
    setUploadedFiles(prev => {
      const all = [...prev, ...processed]
      // Build hash→first-id map
      const hashMap = {}
      for (const f of all) {
        if (!hashMap[f.hash]) {
          hashMap[f.hash] = f.id
          f.isDuplicate = false
          f.duplicateOf = null
        } else {
          f.isDuplicate = true
          f.duplicateOf = hashMap[f.hash]
        }
      }
      return all
    })

    setErrors(newErrors)
    setLoading(false)
  }, [uploadedFiles, setUploadedFiles])

  const removeFile = (fileId) => {
    setUploadedFiles(prev => {
      const remaining = prev.filter(f => f.id !== fileId)
      // Recompute duplicates
      const hashMap = {}
      for (const f of remaining) {
        if (!hashMap[f.hash]) {
          hashMap[f.hash] = f.id
          f.isDuplicate = false
          f.duplicateOf = null
        } else {
          f.isDuplicate = true
          f.duplicateOf = hashMap[f.hash]
        }
      }
      return remaining
    })
    // Also remove from matches
    setMatches(prev => {
      const updated = { ...prev }
      for (const [reqId, fId] of Object.entries(updated)) {
        if (fId === fileId) delete updated[reqId]
      }
      return updated
    })
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files)
  }

  const totalSize = uploadedFiles.reduce((s, f) => s + f.size, 0)
  const usedMatchIds = Object.values(matches)
  const duplicateCount = uploadedFiles.filter(f => f.isDuplicate).length

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Upload PDF Files
        </h2>
        <div className="flex gap-3 text-xs text-gray-500">
          <span className={uploadedFiles.length >= MAX_FILES ? 'text-red-500 font-semibold' : ''}>
            {uploadedFiles.length}/{MAX_FILES} files
          </span>
          <span className={totalSize >= MAX_TOTAL_MB * 1024 * 1024 * 0.9 ? 'text-orange-500 font-semibold' : ''}>
            {formatBytes(totalSize)}/{MAX_TOTAL_MB} MB
          </span>
          {duplicateCount > 0 && (
            <span className="text-yellow-600 font-semibold">{duplicateCount} duplicate{duplicateCount > 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !loading && inputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all mb-4
          ${dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}
          ${loading ? 'opacity-60 cursor-wait' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          className="hidden"
          onChange={(e) => processFiles(e.target.files)}
        />
        {loading ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <svg className="w-8 h-8 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-blue-600 text-sm font-medium">Processing files…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-1">
            <svg className={`w-10 h-10 ${dragging ? 'text-blue-500' : 'text-gray-300'}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-gray-600 text-sm font-medium">Drag & drop PDF files here or <span className="text-blue-600">click to browse</span></p>
            <p className="text-gray-400 text-xs">PDF only · max {MAX_FILES} files · max {MAX_TOTAL_MB} MB total</p>
          </div>
        )}
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          {errors.map((e, i) => (
            <div key={i} className="flex gap-2 text-red-700 text-sm mb-1 last:mb-0">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {e}
            </div>
          ))}
        </div>
      )}

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Uploaded Files</p>
          {uploadedFiles.map((f) => {
            const isMatched = usedMatchIds.includes(f.id)
            return (
              <div
                key={f.id}
                className={`
                  flex items-center gap-3 p-3 rounded-xl border transition-colors text-sm
                  ${f.isDuplicate
                    ? 'border-yellow-300 bg-yellow-50'
                    : isMatched
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-200 bg-gray-50'
                  }
                `}
              >
                {/* PDF Icon */}
                <div className="flex-shrink-0 text-red-500">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                    <path fill="white" d="M14 2v6h6" />
                    <text x="5" y="18" fontSize="5" fill="white" fontWeight="bold">PDF</text>
                  </svg>
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{f.name}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-0.5">
                    <span>{formatBytes(f.size)}</span>
                    <span>{f.pages != null ? `${f.pages} page${f.pages !== 1 ? 's' : ''}` : 'Unknown pages'}</span>
                    <span className="font-mono text-gray-400 hidden sm:inline">{f.hash.slice(0, 8)}…</span>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 flex-shrink-0">
                  {f.isDuplicate && (
                    <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-medium border border-yellow-200">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Duplicate
                    </span>
                  )}
                  {isMatched && !f.isDuplicate && (
                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium border border-green-200">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Matched
                    </span>
                  )}
                  {!isMatched && !f.isDuplicate && (
                    <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full border border-gray-200">
                      Unmatched
                    </span>
                  )}
                </div>

                {/* Remove button */}
                <button
                  onClick={() => removeFile(f.id)}
                  className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Remove file"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      )}

      {uploadedFiles.length === 0 && !loading && (
        <p className="text-center text-gray-400 text-sm py-4">No files uploaded yet.</p>
      )}
    </div>
  )
}
