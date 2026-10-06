import { checkExpiry, formatBytes } from '../utils.js'

export default function MatchingPanel({
  tender, uploadedFiles, matches, setMatches, expiryDates, setExpiryDates
}) {
  // files available to select (not duplicate, or is the canonical of a duplicate group)
  // Duplicate files can still appear in dropdown as it's their canonical copy that matters
  const availableFiles = uploadedFiles.filter(f => !f.isDuplicate)

  // Map fileId -> file object for quick lookup
  const fileMap = Object.fromEntries(uploadedFiles.map(f => [f.id, f]))

  // Map reqId -> fileId
  const matchedFileIds = new Set(Object.values(matches))

  const handleMatch = (reqId, fileId) => {
    if (!fileId) {
      // Clear match
      setMatches(prev => {
        const updated = { ...prev }
        delete updated[reqId]
        return updated
      })
      setExpiryDates(prev => {
        const updated = { ...prev }
        delete updated[reqId]
        return updated
      })
    } else {
      // Remove any existing match for this file (one file = one requirement)
      setMatches(prev => {
        const updated = { ...prev }
        for (const [rid, fid] of Object.entries(updated)) {
          if (fid === fileId && rid !== reqId) delete updated[rid]
        }
        updated[reqId] = fileId
        return updated
      })
    }
  }

  const handleRemoveMatch = (reqId) => {
    handleMatch(reqId, null)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Match Files to Requirements
      </h2>
      <p className="text-gray-500 text-sm mb-6">
        For each required document, select the uploaded PDF file that matches it. 
        Files marked as <span className="text-yellow-600 font-medium">Duplicate</span> cannot be matched separately — only the original is available.
      </p>

      <div className="space-y-4">
        {tender.requirements.map((req) => {
          const matchedFileId = matches[req.id]
          const matchedFile = matchedFileId ? fileMap[matchedFileId] : null
          const expiry = expiryDates[req.id] || ''
          const expiryStatus = req.has_expiry && matchedFile ? checkExpiry(expiry, tender.submission_deadline) : null

          return (
            <div
              key={req.id}
              className={`
                rounded-xl border p-4 transition-all
                ${matchedFile
                  ? expiryStatus === 'expired'
                    ? 'border-red-300 bg-red-50'
                    : expiryStatus === 'needed'
                      ? 'border-orange-300 bg-orange-50'
                      : 'border-green-300 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
                }
              `}
            >
              {/* Requirement Header */}
              <div className="flex flex-wrap items-start gap-2 mb-3">
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {req.order}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-gray-800">{req.title_en}</h3>
                    {req.title_bn && (
                      <span className="text-gray-400 text-sm">{req.title_bn}</span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-1">
                    {req.mandatory
                      ? <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">Mandatory</span>
                      : <span className="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">Optional</span>
                    }
                    {req.has_expiry && (
                      <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">Has Expiry</span>
                    )}
                  </div>
                </div>

                {/* Status badge */}
                <div className="flex-shrink-0">
                  {matchedFile ? (
                    expiryStatus === 'expired' ? (
                      <span className="inline-flex items-center gap-1 bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-medium border border-red-200">
                        ⚠ Expired
                      </span>
                    ) : expiryStatus === 'needed' ? (
                      <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full font-medium border border-orange-200">
                        📅 Expiry Needed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium border border-green-200">
                        ✓ OK
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-400 text-xs px-2 py-1 rounded-full border border-gray-200">
                      No file
                    </span>
                  )}
                </div>
              </div>

              {/* Matching dropdown */}
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <select
                    value={matchedFileId || ''}
                    onChange={(e) => handleMatch(req.id, e.target.value || null)}
                    className={`
                      w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors
                      ${matchedFile ? 'border-blue-300 bg-white' : 'border-gray-300 bg-white'}
                    `}
                  >
                    <option value="">— Select a file —</option>
                    {availableFiles.map((f) => {
                      // Disable if this file is already matched to another requirement
                      const usedElsewhere = matchedFileIds.has(f.id) && matches[req.id] !== f.id
                      return (
                        <option key={f.id} value={f.id} disabled={usedElsewhere}>
                          {f.name} ({f.pages != null ? f.pages + 'pp' : '?pp'}, {formatBytes(f.size)})
                          {usedElsewhere ? ' — already matched' : ''}
                        </option>
                      )
                    })}
                  </select>
                </div>

                {matchedFile && (
                  <button
                    onClick={() => handleRemoveMatch(req.id)}
                    className="flex-shrink-0 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 border border-gray-200 hover:border-red-200 transition-colors"
                    title="Remove match"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Matched file details */}
              {matchedFile && (
                <div className="mt-2 text-xs text-gray-500 flex gap-3 pl-1">
                  <span>{formatBytes(matchedFile.size)}</span>
                  <span>{matchedFile.pages != null ? matchedFile.pages + ' pages' : 'Unknown pages'}</span>
                  <span className="font-mono text-gray-400">{matchedFile.hash.slice(0, 8)}…</span>
                </div>
              )}

              {/* Expiry date input */}
              {req.has_expiry && matchedFile && (
                <div className="mt-3 flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Expiry Date:
                  </label>
                  <input
                    type="date"
                    value={expiry}
                    onChange={(e) => setExpiryDates(prev => ({ ...prev, [req.id]: e.target.value }))}
                    className={`
                      border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors
                      ${expiryStatus === 'expired'
                        ? 'border-red-400 bg-red-50 text-red-700'
                        : expiryStatus === 'needed'
                          ? 'border-orange-400 bg-orange-50'
                          : 'border-green-400 bg-green-50 text-green-700'
                      }
                    `}
                  />
                  {expiryStatus === 'expired' && (
                    <span className="text-red-600 text-xs font-medium">
                      ⚠ Expires before submission deadline ({tender.submission_deadline})
                    </span>
                  )}
                  {expiryStatus === 'ok' && (
                    <span className="text-green-600 text-xs font-medium">
                      ✓ Valid until or after {tender.submission_deadline}
                    </span>
                  )}
                  {expiryStatus === 'needed' && (
                    <span className="text-orange-600 text-xs font-medium">
                      Please enter expiry date
                    </span>
                  )}
                </div>
              )}

              {/* No available files warning */}
              {availableFiles.length === 0 && (
                <p className="text-xs text-gray-400 mt-2 italic">
                  No files available — upload PDFs first.
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
