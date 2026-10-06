import { useState, useCallback } from 'react'
import LoadRequirements from './components/LoadRequirements.jsx'
import TenderInfo from './components/TenderInfo.jsx'
import UploadFiles from './components/UploadFiles.jsx'
import MatchingPanel from './components/MatchingPanel.jsx'
import StatusPanel from './components/StatusPanel.jsx'
import GeneratePackage from './components/GeneratePackage.jsx'

const STEPS = ['Load Requirements', 'Upload PDFs', 'Match & Dates', 'Review & Generate']

export default function App() {
  const [step, setStep] = useState(0)
  const [tender, setTender] = useState(null)        // parsed requirements.json
  const [uploadedFiles, setUploadedFiles] = useState([]) // [{id, file, name, pages, size, hash, isDuplicate, duplicateOf}]
  const [matches, setMatches] = useState({})         // { requirementId: fileId }
  const [expiryDates, setExpiryDates] = useState({}) // { requirementId: 'YYYY-MM-DD' }

  const handleTenderLoaded = useCallback((data) => {
    setTender(data)
    setUploadedFiles([])
    setMatches({})
    setExpiryDates({})
    setStep(1)
  }, [])

  const canGoToStep = (s) => {
    if (s === 0) return true
    if (s === 1) return !!tender
    if (s === 2) return !!tender && uploadedFiles.length > 0
    if (s === 3) return !!tender && uploadedFiles.length > 0
    return false
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="bg-blue-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <svg className="w-8 h-8 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div>
            <h1 className="text-xl font-bold leading-tight">Tender Package Builder</h1>
            <p className="text-blue-200 text-xs">Assemble · Check · Submit</p>
          </div>
          {tender && (
            <div className="ml-auto text-right text-xs text-blue-200">
              <p className="font-semibold text-white">{tender.tender_title}</p>
              <p>{tender.tender_id} · Deadline: {tender.submission_deadline}</p>
            </div>
          )}
        </div>
      </header>

      {/* Step Tabs */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-0" aria-label="Steps">
            {STEPS.map((label, i) => {
              const active = step === i
              const enabled = canGoToStep(i)
              return (
                <button
                  key={i}
                  onClick={() => enabled && setStep(i)}
                  disabled={!enabled}
                  className={`
                    relative px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                    ${active
                      ? 'border-blue-600 text-blue-700 bg-blue-50'
                      : enabled
                        ? 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        : 'border-transparent text-gray-300 cursor-not-allowed'
                    }
                  `}
                >
                  <span className={`
                    inline-flex items-center justify-center w-5 h-5 rounded-full text-xs mr-2 font-bold
                    ${active ? 'bg-blue-600 text-white' : enabled ? 'bg-gray-200 text-gray-600' : 'bg-gray-100 text-gray-300'}
                  `}>{i + 1}</span>
                  {label}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {step === 0 && (
          <div className="space-y-6">
            <LoadRequirements onLoaded={handleTenderLoaded} />
          </div>
        )}
        {step === 1 && tender && (
          <div className="space-y-6">
            <TenderInfo tender={tender} />
            <UploadFiles
              uploadedFiles={uploadedFiles}
              setUploadedFiles={setUploadedFiles}
              matches={matches}
              setMatches={setMatches}
            />
            {uploadedFiles.length > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Next: Match & Dates →
                </button>
              </div>
            )}
          </div>
        )}
        {step === 2 && tender && (
          <div className="space-y-6">
            <MatchingPanel
              tender={tender}
              uploadedFiles={uploadedFiles}
              matches={matches}
              setMatches={setMatches}
              expiryDates={expiryDates}
              setExpiryDates={setExpiryDates}
            />
            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors">
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Next: Review & Generate →
              </button>
            </div>
          </div>
        )}
        {step === 3 && tender && (
          <div className="space-y-6">
            <StatusPanel
              tender={tender}
              uploadedFiles={uploadedFiles}
              matches={matches}
              expiryDates={expiryDates}
            />
            <GeneratePackage
              tender={tender}
              uploadedFiles={uploadedFiles}
              matches={matches}
              expiryDates={expiryDates}
            />
            <div className="flex justify-start">
              <button onClick={() => setStep(2)} className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors">
                ← Back to Matching
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
