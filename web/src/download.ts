export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function downloadText(filename: string, content: string) {
  downloadBlob(filename, new Blob([content], { type: 'text/csv;charset=utf-8' }));
}
