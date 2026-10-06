import { checkExpiry } from '../utils.js'

function StatusBadge({ status }) {
  const styles = {
    ok: 'bg-green-100 text-green-700 border-green-200',
    expired: 'bg-red-100 text-red-600 border-red-200',
    needed: 'bg-orange-100 text-orange-600 border-orange-200',
    missing: 'bg-gray-100 text-gray-400 border-gray-200',
    optional_missing: 'bg-gray-50 text-gray-400 border-gray-200',
  }
  const labels = {
    ok: '✓ OK',
    expired: '⚠ Expired',
    needed: '📅 Expiry Needed',
    missing: '✗ Missing',
    optional_missing: '○ Optional – Not Provided',
  }
  return (
    <span className={`inline-block border rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] || styles.missing}`}>
      {labels[status] || status}
    </span>
  )
}

export default function StatusPanel({ tender, uploadedFiles, matches, expiryDates }) {
  const fileMap = Object.fromEntries(uploadedFiles.map(f => [f.id, f]))
  const duplicates = uploadedFiles.filter(f => f.isDuplicate)
  const unmatched = uploadedFiles.filter(f => !f.isDuplicate && !Object.values(matches).includes(f.id))

  // Compute per-requirement status
  const reqStatuses = tender.requirements.map(req => {
    const fileId = matches[req.id]
    const file = fileId ? fileMap[fileId] : null
    let status
    if (!file) {
      status = req.mandatory ? 'missing' : 'optional_missing'
    } else if (req.has_expiry) {
      status = checkExpiry(expiryDates[req.id] || '', tender.submission_deadline)
    } else {
      status = 'ok'
    }
    return { req, file, status }
  })

  const missingMandatory = reqStatuses.filter(r => r.status === 'missing').length
  const expiredCount = reqStatuses.filter(r => r.status === 'expired').length
  const expiryNeeded = reqStatuses.filter(r => r.status === 'needed').length
  const okCount = reqStatuses.filter(r => r.status === 'ok').length
  const totalReqs = tender.requirements.length

  const isReadyToGenerate = missingMandatory === 0 && expiredCount === 0 && expiryNeeded === 0

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        Package Status Review
      </h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl border p-3 text-center bg-blue-50 border-blue-200">
          <p className="text-2xl font-bold text-blue-700">{okCount}</p>
          <p className="text-xs text-blue-600">Ready</p>
        </div>
        <div className={`rounded-xl border p-3 text-center ${missingMandatory > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
          <p className={`text-2xl font-bold ${missingMandatory > 0 ? 'text-red-600' : 'text-gray-400'}`}>{missingMandatory}</p>
          <p className={`text-xs ${missingMandatory > 0 ? 'text-red-500' : 'text-gray-400'}`}>Missing Mandatory</p>
        </div>
        <div className={`rounded-xl border p-3 text-center ${expiredCount > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
          <p className={`text-2xl font-bold ${expiredCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>{expiredCount}</p>
          <p className={`text-xs ${expiredCount > 0 ? 'text-red-500' : 'text-gray-400'}`}>Expired</p>
        </div>
        <div className={`rounded-xl border p-3 text-center ${expiryNeeded > 0 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
          <p className={`text-2xl font-bold ${expiryNeeded > 0 ? 'text-orange-600' : 'text-gray-400'}`}>{expiryNeeded}</p>
          <p className={`text-xs ${expiryNeeded > 0 ? 'text-orange-500' : 'text-gray-400'}`}>Expiry Needed</p>
        </div>
      </div>

      {/* Overall readiness */}
      <div className={`rounded-xl p-4 mb-6 border ${isReadyToGenerate ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center gap-3">
          {isReadyToGenerate ? (
            <>
              <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-semibold text-green-800">Package is ready to generate!</p>
                <p className="text-green-700 text-sm">{okCount}/{totalReqs} requirements fulfilled. You can generate the PDF package below.</p>
              </div>
            </>
          ) : (
            <>
              <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-semibold text-red-700">Package has issues</p>
                <p className="text-red-600 text-sm">
                  Please resolve:
                  {missingMandatory > 0 && ` ${missingMandatory} missing mandatory document(s)`}
                  {expiredCount > 0 && ` ${expiredCount} expired document(s)`}
                  {expiryNeeded > 0 && ` ${expiryNeeded} missing expiry date(s)`}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Per-requirement table */}
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 pr-4 text-gray-400 font-medium w-8">#</th>
              <th className="text-left py-2 pr-4 text-gray-400 font-medium">Requirement</th>
              <th className="text-left py-2 pr-4 text-gray-400 font-medium hidden md:table-cell">File Assigned</th>
              <th className="text-left py-2 pr-4 text-gray-400 font-medium hidden md:table-cell">Expiry</th>
              <th className="text-left py-2 text-gray-400 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {reqStatuses.map(({ req, file, status }) => (
              <tr key={req.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2.5 pr-4 text-gray-400 text-xs">{req.order}</td>
                <td className="py-2.5 pr-4">
                  <p className="font-medium text-gray-800">{req.title_en}</p>
                  {req.mandatory && (
                    <span className="text-xs text-red-500">Mandatory</span>
                  )}
                </td>
                <td className="py-2.5 pr-4 hidden md:table-cell">
                  {file ? (
                    <span className="text-gray-700 truncate block max-w-xs" title={file.name}>{file.name}</span>
                  ) : (
                    <span className="text-gray-300 italic">None</span>
                  )}
                </td>
                <td className="py-2.5 pr-4 hidden md:table-cell text-gray-600">
                  {req.has_expiry && file ? (expiryDates[req.id] || <span className="text-orange-500 italic">Not entered</span>) : '—'}
                </td>
                <td className="py-2.5">
                  <StatusBadge status={status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Duplicates warning */}
      {duplicates.length > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-yellow-700 font-medium text-sm mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {duplicates.length} Duplicate File{duplicates.length > 1 ? 's' : ''} Detected
          </p>
          <ul className="text-xs text-yellow-700 space-y-1">
            {duplicates.map(f => {
              const orig = uploadedFiles.find(u => u.id === f.duplicateOf)
              return (
                <li key={f.id}>
                  <span className="font-mono">{f.name}</span>
                  {orig && <span className="text-yellow-600"> is identical to <span className="font-mono">{orig.name}</span></span>}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Unmatched files */}
      {unmatched.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-blue-700 font-medium text-sm mb-1">
            {unmatched.length} uploaded file{unmatched.length > 1 ? 's are' : ' is'} not matched to any requirement:
          </p>
          <ul className="text-xs text-blue-600 space-y-0.5">
            {unmatched.map(f => <li key={f.id} className="font-mono">{f.name}</li>)}
          </ul>
          <p className="text-blue-500 text-xs mt-1 italic">These files will not be included in the generated package.</p>
        </div>
      )}
    </div>
  )
}
