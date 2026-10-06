const INFO_LABELS = [
  { key: 'tender_id', label: 'Tender ID' },
  { key: 'tender_title', label: 'Tender Title' },
  { key: 'procuring_entity', label: 'Procuring Entity' },
  { key: 'bidder', label: 'Bidder' },
  { key: 'submission_deadline', label: 'Submission Deadline' },
]

export default function TenderInfo({ tender }) {
  const mandatory = tender.requirements.filter(r => r.mandatory).length
  const optional = tender.requirements.length - mandatory

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Tender Information
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {INFO_LABELS.map(({ key, label }) => (
          <div key={key} className={key === 'tender_title' ? 'md:col-span-2' : ''}>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
            <p className={`font-semibold text-gray-800 ${key === 'submission_deadline' ? 'text-red-700' : ''}`}>
              {tender[key]}
            </p>
          </div>
        ))}
      </div>

      {/* Requirements list */}
      <div>
        <h3 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
          Required Documents
          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
            {tender.requirements.length} total
          </span>
          <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
            {mandatory} mandatory
          </span>
          {optional > 0 && (
            <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">
              {optional} optional
            </span>
          )}
        </h3>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 pr-4 text-gray-400 font-medium w-8">#</th>
                <th className="text-left py-2 pr-4 text-gray-400 font-medium">Document</th>
                <th className="text-left py-2 pr-4 text-gray-400 font-medium hidden sm:table-cell">Bengali</th>
                <th className="text-center py-2 pr-4 text-gray-400 font-medium">Required</th>
                <th className="text-center py-2 text-gray-400 font-medium">Expiry</th>
              </tr>
            </thead>
            <tbody>
              {tender.requirements.map((req) => (
                <tr key={req.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 pr-4 text-gray-400 text-xs">{req.order}</td>
                  <td className="py-2 pr-4">
                    <span className="font-medium text-gray-800">{req.title_en}</span>
                    <span className="ml-2 text-xs text-gray-400">{req.id}</span>
                  </td>
                  <td className="py-2 pr-4 text-gray-500 hidden sm:table-cell">{req.title_bn || '—'}</td>
                  <td className="py-2 pr-4 text-center">
                    {req.mandatory
                      ? <span className="inline-block bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-medium">Mandatory</span>
                      : <span className="inline-block bg-gray-100 text-gray-400 text-xs px-2 py-0.5 rounded-full">Optional</span>
                    }
                  </td>
                  <td className="py-2 text-center">
                    {req.has_expiry
                      ? <span className="inline-block bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full">Has Expiry</span>
                      : <span className="text-gray-300 text-xs">—</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
