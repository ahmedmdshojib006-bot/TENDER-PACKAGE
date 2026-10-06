/**
 * Generate 10 sample PDF files for testing Tender Package Builder
 * Run: node generate-sample-pdfs.js
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const docs = [
  { name: 'R01_Trade_License.pdf',                   title: 'Trade License',                              bn: 'ট্রেড লাইসেন্স',                          expiry: '2026-06-30', pages: 1 },
  { name: 'R02_TIN_Certificate.pdf',                  title: 'TIN Certificate',                            bn: 'টিআইএন সার্টিফিকেট',                      expiry: null,         pages: 1 },
  { name: 'R03_VAT_Registration.pdf',                 title: 'VAT Registration Certificate',               bn: 'ভ্যাট নিবন্ধন সার্টিফিকেট',               expiry: '2026-03-15', pages: 2 },
  { name: 'R04_Bank_Solvency.pdf',                    title: 'Bank Solvency Certificate',                  bn: 'ব্যাংক সলভেন্সি সার্টিফিকেট',             expiry: '2026-01-10', pages: 1 },
  { name: 'R05_Experience_Certificate.pdf',           title: 'Experience Certificate',                     bn: 'অভিজ্ঞতা সার্টিফিকেট',                    expiry: null,         pages: 3 },
  { name: 'R06_Audited_Financial_Statement.pdf',      title: 'Audited Financial Statement (Last 3 Years)', bn: 'নিরীক্ষিত আর্থিক বিবরণী',                  expiry: null,         pages: 4 },
  { name: 'R07_Bid_Security.pdf',                     title: 'Bid Security / Earnest Money Deposit',       bn: 'বিড সিকিউরিটি',                            expiry: '2026-02-28', pages: 1 },
  { name: 'R08_Technical_Specification.pdf',          title: 'Technical Specification Compliance Sheet',   bn: 'প্রযুক্তিগত বিশেষ বিবরণ সম্মতি পত্র',    expiry: null,         pages: 5 },
  { name: 'R09_Company_Registration.pdf',             title: 'Company Registration Certificate',           bn: 'কোম্পানি নিবন্ধন সার্টিফিকেট',             expiry: null,         pages: 2 },
  { name: 'R10_Power_of_Attorney.pdf',                title: 'Power of Attorney',                          bn: 'পাওয়ার অব অ্যাটর্নি',                      expiry: null,         pages: 1 },
]

const outDir = join(__dirname, 'sample-pdfs')
mkdirSync(outDir, { recursive: true })

async function makePdf(doc) {
  const pdf = await PDFDocument.create()
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const fontReg  = await pdf.embedFont(StandardFonts.Helvetica)

  for (let p = 0; p < doc.pages; p++) {
    const page = pdf.addPage([595, 842])
    const { width, height } = page.getSize()

    // Header bar
    page.drawRectangle({ x: 0, y: height - 100, width, height: 100, color: rgb(0.12, 0.33, 0.6) })

    // Watermark background
    page.drawText('SAMPLE DOCUMENT', {
      x: 80, y: height / 2 - 20,
      size: 52, font: fontBold,
      color: rgb(0.92, 0.94, 0.97),
      rotate: { type: 'degrees', angle: 35 },
    })

    // Title
    page.drawText(doc.title, {
      x: 40, y: height - 60,
      size: 20, font: fontBold,
      color: rgb(1, 1, 1),
      maxWidth: width - 80,
    })

    // Subtitle
    page.drawText('Government of Bangladesh — Sample Document', {
      x: 40, y: height - 82,
      size: 10, font: fontReg,
      color: rgb(0.75, 0.87, 1),
    })

    const rows = [
      ['Document Type', doc.title],
      ['Issued To',     'ABC Trade Corporation Ltd.'],
      ['Issued By',     'Competent Authority, Government of Bangladesh'],
      ['Issue Date',    '2025-01-15'],
      ['Valid Until',   doc.expiry || 'Permanent / No Expiry'],
      ['Reference No',  'REF-2025-' + doc.name.split('_')[0]],
    ]

    let y = height - 150
    for (const [label, value] of rows) {
      page.drawText(label + ':', { x: 50, y, size: 9, font: fontBold, color: rgb(0.4, 0.45, 0.55) })
      page.drawText(value,       { x: 200, y, size: 10, font: fontReg, color: rgb(0.1, 0.15, 0.25), maxWidth: 340 })
      y -= 30
      page.drawLine({ start: { x: 50, y: y + 18 }, end: { x: width - 50, y: y + 18 }, thickness: 0.4, color: rgb(0.88, 0.9, 0.93) })
    }

    // Body text
    y -= 20
    const body = `This is to certify that ${doc.title} has been duly issued to ABC Trade Corporation Ltd. ` +
      `This document is authentic and valid for the purposes stated herein. ` +
      `Any unauthorized modification of this document is strictly prohibited and punishable under applicable law. ` +
      `This sample document is generated for testing purposes only.`
    page.drawText(body, { x: 50, y, size: 9, font: fontReg, color: rgb(0.35, 0.38, 0.44), maxWidth: width - 100, lineHeight: 16 })

    // Page number
    if (doc.pages > 1) {
      page.drawText(`Page ${p + 1} of ${doc.pages}`, {
        x: width / 2 - 30, y: 30,
        size: 9, font: fontReg, color: rgb(0.6, 0.63, 0.68),
      })
    }

    // Footer
    page.drawText('SAMPLE — FOR TESTING ONLY — Tender Package Builder', {
      x: 50, y: 18,
      size: 7, font: fontBold, color: rgb(0.7, 0.2, 0.2),
    })
  }

  return await pdf.save()
}

console.log('Generating sample PDFs...\n')
for (const doc of docs) {
  const bytes = await makePdf(doc)
  const outPath = join(outDir, doc.name)
  writeFileSync(outPath, bytes)
  console.log(`✓  ${doc.name}  (${doc.pages} page${doc.pages > 1 ? 's' : ''}, ${(bytes.length / 1024).toFixed(0)} KB)`)
}

console.log(`\n✅ All 10 PDFs saved to: ${outDir}`)
