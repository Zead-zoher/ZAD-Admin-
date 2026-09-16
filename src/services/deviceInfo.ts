export async function getClientPublicIP(): Promise<{ ip: string; location: string; countryCode: string }> {
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (res.ok) {
      const data = await res.json();
      if (data.ip) {
        return {
          ip: data.ip,
          location: data.city ? `${data.city}, ${data.country_name || ''}` : (data.country_name || 'غير محدد'),
          countryCode: data.country_code || 'UN',
        };
      }
    }
  } catch {
    // fallback if adblocker or CORS blocked
  }

  try {
    const res2 = await fetch('https://api.ipify.org?format=json');
    if (res2.ok) {
      const data2 = await res2.json();
      if (data2.ip) {
        return {
          ip: data2.ip,
          location: 'موقع غير محدد',
          countryCode: 'UN',
        };
      }
    }
  } catch {
    // fallback
  }

  return {
    ip: 'جاري التحقق...',
    location: 'موقع غير معروف',
    countryCode: 'UN',
  };
}

export function getClientDeviceInfo(): {
  os: string;
  browser: string;
  deviceId: string;
  screenRes: string;
} {
  const ua = navigator.userAgent;
  let os = 'Unknown OS';
  if (ua.includes('Win')) os = 'Windows 11 / 64-bit';
  else if (ua.includes('Mac')) os = 'macOS Ventura';
  else if (ua.includes('Android')) os = 'Android 14 / Mobile';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS 17.5 / iPhone';
  else if (ua.includes('Linux')) os = 'Linux / Ubuntu';

  let browser = 'Chrome';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';

  // Generate deterministic device ID based on screen + canvas/navigator signature
  const fingerprintRaw = `${navigator.userAgent}_${screen.width}x${screen.height}_${navigator.language}_${screen.colorDepth}`;
  let hash = 0;
  for (let i = 0; i < fingerprintRaw.length; i++) {
    hash = (hash << 5) - hash + fingerprintRaw.charCodeAt(i);
    hash |= 0;
  }
  const deviceId = `FP-${Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')}-${Math.abs((hash * 31) | 0).toString(16).toUpperCase().padStart(4, '0')}`;

  return {
    os,
    browser,
    deviceId,
    screenRes: `${window.screen.width}x${window.screen.height}`,
  };
}
