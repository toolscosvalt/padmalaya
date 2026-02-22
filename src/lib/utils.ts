export function convertGoogleDriveUrl(url: string): string {
  if (!url) return '';

  const driveRegex = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
  const match = url.match(driveRegex);

  if (match && match[1]) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }

  return url;
}
