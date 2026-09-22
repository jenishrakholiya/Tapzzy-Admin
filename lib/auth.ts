// Standard Web Crypto HMAC session token utility
// Compatible with both Next.js Edge Middleware and Node.js Server Runtimes

export const ADMIN_COOKIE_NAME = 'tapyy_admin_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

const DEFAULT_SECRET = 'tapyy_admin_secret_jwt_key_2026_super_secure';

function getSecretKey(): string {
  return process.env.ADMIN_SESSION_SECRET || DEFAULT_SECRET;
}


export function getAdminCredentials() {
  return {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123456',
  };
}

export function validateAdminCredentials(usernameInput?: string, passwordInput?: string): boolean {
  if (!usernameInput || !passwordInput) return false;
  const { username, password } = getAdminCredentials();
  return (
    usernameInput.trim().toLowerCase() === username.toLowerCase() &&
    passwordInput.trim() === password
  );
}

// Convert string to Uint8Array (BufferSource)
function strToBuffer(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Base64Url helper
function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Sign payload
export async function createSessionToken(username: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: username,
    role: 'super_admin',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  };

  const encHeader = base64UrlEncode(strToBuffer(JSON.stringify(header)));
  const encPayload = base64UrlEncode(strToBuffer(JSON.stringify(payload)));
  const dataToSign = `${encHeader}.${encPayload}`;

  const key = await crypto.subtle.importKey(
    'raw',
    strToBuffer(getSecretKey()) as unknown as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, strToBuffer(dataToSign) as unknown as BufferSource);
  const encSignature = base64UrlEncode(signature);

  return `${dataToSign}.${encSignature}`;
}

// Verify payload
export async function verifySessionToken(token: string): Promise<{ valid: boolean; username?: string }> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return { valid: false };

    const [encHeader, encPayload, encSignature] = parts;
    const dataToSign = `${encHeader}.${encPayload}`;

    const key = await crypto.subtle.importKey(
      'raw',
      strToBuffer(getSecretKey()) as unknown as BufferSource,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureBytes = base64UrlDecode(encSignature);
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes as unknown as BufferSource,
      strToBuffer(dataToSign) as unknown as BufferSource
    );

    if (!isValid) return { valid: false };

    const payloadJson = new TextDecoder().decode(base64UrlDecode(encPayload));
    const payload = JSON.parse(payloadJson);


    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false };
    }

    return { valid: true, username: payload.sub };
  } catch {
    return { valid: false };
  }
}


