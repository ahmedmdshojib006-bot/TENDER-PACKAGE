// Compute SHA-256 hash of a file's ArrayBuffer using Web Crypto API
export async function computeFileHash(arrayBuffer) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Get page count using pdf.js
export async function getPdfPageCount(arrayBuffer) {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
  ).href;
  try {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    return pdf.numPages;
  } catch {
    return null;
  }
}

// Format bytes to human-readable
export function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Compare expiry date vs submission deadline (both as YYYY-MM-DD strings)
// Returns 'expired' | 'ok' | 'needed'
export function checkExpiry(expiryDate, submissionDeadline) {
  if (!expiryDate) return 'needed';
  // Compare date strings directly (YYYY-MM-DD is lexicographically comparable)
  if (expiryDate < submissionDeadline) return 'expired';
  return 'ok';
}
