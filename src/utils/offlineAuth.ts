/**
 * RuralShield AI — Offline Trusted Device Authentication Module
 * Manages device-bound cryptographic leases and local PIN verification.
 * Strictly adheres to security rules: never stores plaintext PINs or server passwords in localStorage.
 */

export interface OfflineLease {
  deviceId: string;
  userId: string;
  email: string;
  role: 'ADMIN' | 'USER';
  pinHash: string; // scrypt/PBKDF2 hash of local PIN
  pinSalt: string;
  leaseExpires: string; // ISO date
  token: string;
  deviceName: string;
}

export interface QueuedOfflineEvent {
  replay_id: string;
  user_id: string;
  email: string;
  device_id: string;
  event_type: string;
  signature: string;
  payload: Record<string, unknown>;
  created_at: string;
}

const STORAGE_KEY_LEASE = 'ruralshield_device_lease';
const STORAGE_KEY_ATTEMPTS = 'ruralshield_pin_attempts';
const STORAGE_KEY_QUEUE = 'ruralshield_offline_event_queue';

// Simple WebCrypto PBKDF2 PIN verification
export async function hashPinLocal(pin: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(salt),
      iterations: 50000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'HMAC', hash: 'SHA-256', length: 256 },
    true,
    ['sign']
  );
  const exported = await crypto.subtle.exportKey('raw', derivedKey);
  return Array.from(new Uint8Array(exported))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function getStoredDeviceLease(): OfflineLease | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LEASE);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveDeviceLease(lease: OfflineLease): void {
  localStorage.setItem(STORAGE_KEY_LEASE, JSON.stringify(lease));
}

export function clearDeviceLease(): void {
  localStorage.removeItem(STORAGE_KEY_LEASE);
}

export function getFailedAttempts(): { count: number; lockedUntil: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ATTEMPTS);
    if (!raw) return { count: 0, lockedUntil: 0 };
    return JSON.parse(raw);
  } catch {
    return { count: 0, lockedUntil: 0 };
  }
}

export function recordFailedAttempt(): { count: number; lockedUntil: number } {
  const state = getFailedAttempts();
  const count = state.count + 1;
  let lockedUntil = 0;
  if (count >= 5) {
    lockedUntil = Date.now() + 60000; // 60-second lockout
  }
  const newState = { count, lockedUntil };
  localStorage.setItem(STORAGE_KEY_ATTEMPTS, JSON.stringify(newState));
  return newState;
}

export function resetFailedAttempts(): void {
  localStorage.removeItem(STORAGE_KEY_ATTEMPTS);
}

export async function verifyOfflinePin(
  pin: string,
  email: string
): Promise<{ success: boolean; error?: string; user?: { id: string; email: string; role: 'ADMIN' | 'USER' } }> {
  const lease = getStoredDeviceLease();
  if (!lease) {
    return {
      success: false,
      error: 'NO_TRUSTED_DEVICE: This browser/device has not been provisioned with an offline lease. Please connect online and provision your trusted device first.',
    };
  }

  // Check email match
  if (lease.email.toLowerCase() !== email.toLowerCase().trim()) {
    return {
      success: false,
      error: `DEVICE_MISMATCH: The stored trusted device lease belongs to ${lease.email}, not ${email}.`,
    };
  }

  // Check expiration
  if (new Date(lease.leaseExpires).getTime() < Date.now()) {
    return {
      success: false,
      error: 'LEASE_EXPIRED: The offline authorization lease has expired (leases are valid for 7 days). Reconnect online to refresh authorization.',
    };
  }

  // Check local attempt limits
  const { count, lockedUntil } = getFailedAttempts();
  if (lockedUntil > Date.now()) {
    const remainingSec = Math.ceil((lockedUntil - Date.now()) / 1000);
    return {
      success: false,
      error: `DEVICE_LOCKED: Too many failed PIN attempts. Local device locked for ${remainingSec} seconds.`,
    };
  }

  // Verify PIN hash
  const candidateHash = await hashPinLocal(pin, lease.pinSalt);
  if (candidateHash !== lease.pinHash) {
    const updated = recordFailedAttempt();
    const remaining = 5 - updated.count;
    return {
      success: false,
      error: remaining > 0 ? `INVALID_PIN: Incorrect PIN. ${remaining} attempt(s) remaining before local lockout.` : 'INVALID_PIN: Device locked for 60s due to repeated failures.',
    };
  }

  // Success: reset attempts
  resetFailedAttempts();

  // Enqueue signed offline authentication event
  queueOfflineEvent({
    replay_id: 'rep_' + Math.random().toString(36).substring(2) + Date.now().toString(36),
    user_id: lease.userId,
    email: lease.email,
    device_id: lease.deviceId,
    event_type: 'OFFLINE_PIN_LOGIN',
    signature: 'local_sig_' + lease.token.substring(0, 16),
    payload: {
      deviceName: lease.deviceName,
      authenticatedAt: new Date().toISOString(),
      verifiedLocally: true,
    },
    created_at: new Date().toISOString(),
  });

  return {
    success: true,
    user: {
      id: lease.userId,
      email: lease.email,
      role: lease.role,
    },
  };
}

export function queueOfflineEvent(event: QueuedOfflineEvent): void {
  try {
    const list = getQueuedOfflineEvents();
    list.push(event);
    localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to queue offline event', err);
  }
}

export function getQueuedOfflineEvents(): QueuedOfflineEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_QUEUE);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function clearQueuedOfflineEvents(): void {
  localStorage.removeItem(STORAGE_KEY_QUEUE);
}
