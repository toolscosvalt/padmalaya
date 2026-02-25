export const WHATSAPP_DEFAULT_MESSAGE = 'Hey, I am interested in learning more about Padmalaya Group properties. Could you please share more details?';

export function getWhatsAppUrl(whatsappNumber: string, message: string = WHATSAPP_DEFAULT_MESSAGE): string {
  const phoneNumber = whatsappNumber.replace(/[^0-9]/g, '');
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}

export function convertGoogleDriveUrl(url: string): string {
  if (!url) return '';

  // Extract file ID from various Google Drive URL formats
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) {
    const fileId = match[1];
    // Use thumbnail API with large size for better reliability
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  }

  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) {
    return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w1000`;
  }

  return url;
}
