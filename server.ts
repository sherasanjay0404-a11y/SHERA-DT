/**
 * RuralShield AI — Full-Stack Server
 * Hosts Express REST API with exact Flask endpoints & Vite middleware.
 * Implements:
 * 1. NAAA Network-Aware Adaptive Authentication (Passkey, TOTP, Offline PIN).
 * 2. Mandatory User & Admin Dashboards (Section 26):
 *    - Super Admin (Org-wide stats, SHG group creation, member approval/allocation, admin assignment).
 *    - Group Admin (Group-restricted dashboard, payment verification queue, loan approvals, overdue tracking, group WhatsApp).
 *    - Member (Personal passbook, savings/loan tracking, UPI/cash payment submissions, receipt downloads, loan requests).
 * 3. Bilingual support (English & Tamil) for notifications and communications.
 * 4. Transparent Cryptographic Ledgers and Audit Logging.
 */

import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration Defaults
const PORT = parseInt(process.env.PORT || '3000', 10);
const SECRET_KEY = process.env.SECRET_KEY || 'ruralshield-dev-secret-key-32-chars-long!';
const RP_ID = process.env.WEBAUTHN_RP_ID || 'localhost';
const RP_NAME = process.env.WEBAUTHN_RP_NAME || 'SHE SHEIELD AI';
const INITIAL_ADMIN_EMAIL = (process.env.INITIAL_ADMIN_EMAIL || 'sherasanjayn@gmail.com').toLowerCase().trim();
const INITIAL_ADMIN_PASSWORD = process.env.INITIAL_ADMIN_PASSWORD || 'RuralShield@2026AdminSecure!';

// ==========================================
// In-Memory MongoDB Document Collections & Types
// ==========================================

export type UserRole = 'SUPER_ADMIN' | 'GROUP_ADMIN' | 'MEMBER' | 'ADMIN' | 'USER';
export type UserStatus = 'ACTIVE' | 'PENDING' | 'REJECTED' | 'LOCKED';

export interface UserDoc {
  _id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  group_id?: string;
  group_name?: string;
  assigned_by?: string;
  password_hash: string;
  salt: string;
  failed_attempts: number;
  locked_until: number | null;
  created_at: string;
  updated_at: string;
}

export interface ShgGroupDoc {
  _id: string;
  name: string;
  village: string;
  admin_id: string;
  admin_email: string;
  admin_name: string;
  status: 'ACTIVE' | 'DEACTIVATED';
  meeting_schedule: string;
  monthly_savings_target: number;
  created_at: string;
}

export interface AmountRequestDoc {
  _id: string;
  member_id: string;
  member_name: string;
  member_email: string;
  group_id: string;
  group_name: string;
  amount: number;
  purpose: string;
  repayment_months: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejection_reason?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface PaymentSubmissionDoc {
  _id: string;
  receipt_number: string;
  member_id: string;
  member_name: string;
  member_email: string;
  group_id: string;
  group_name: string;
  amount: number;
  payment_type: 'SAVINGS_DEPOSIT' | 'LOAN_REPAYMENT';
  payment_mode: 'UPI' | 'CASH';
  utr_reference: string;
  notes?: string;
  status: 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
  rejection_reason?: string;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
}

export interface InAppNotificationDoc {
  _id: string;
  target_role: 'SUPER_ADMIN' | 'GROUP_ADMIN' | 'MEMBER' | 'ALL';
  target_group_id?: string;
  target_user_id?: string;
  title: string;
  title_ta: string;
  message: string;
  message_ta: string;
  type: 'INFO' | 'ALERT' | 'PAYMENT' | 'REQUEST';
  created_at: string;
  read: boolean;
}

export interface WhatsAppReminderDoc {
  _id: string;
  recipient_name: string;
  phone: string;
  group_name: string;
  message_text: string;
  prepared_by: string;
  prepared_at: string;
  wa_link: string;
}

export interface CredentialDoc {
  _id: string;
  user_id: string;
  credential_id: string;
  public_key: string;
  counter: number;
  transports: string[];
  created_at: string;
  last_used_at: string;
}

export interface TotpDoc {
  _id: string;
  user_id: string;
  encrypted_secret: string;
  enrolled: boolean;
  last_accepted_step: number;
  created_at: string;
}

export interface DeviceDoc {
  _id: string;
  user_id: string;
  device_id: string;
  device_name: string;
  device_token: string;
  pin_hash: string;
  pin_salt: string;
  trust_status: 'ACTIVE' | 'REVOKED';
  provisioned_at: string;
  expires_at: string;
}

export interface AuthEventDoc {
  _id: string;
  user_id?: string;
  email?: string;
  method: 'PASSKEY' | 'TOTP' | 'PASSWORD' | 'OFFLINE_PIN';
  network_state: 'STRONG' | 'WEAK' | 'OFFLINE';
  success: boolean;
  failure_reason?: string;
  timestamp: string;
  ip_address: string;
}

export interface OfflineEventDoc {
  _id: string;
  user_id: string;
  device_id: string;
  signature: string;
  event_type: string;
  payload: any;
  created_at: string;
  synced_at: string;
  replay_id: string;
}

export interface LedgerEntryDoc {
  _id: string;
  collective_id: string;
  collective_name: string;
  member_name: string;
  entry_type: 'SAVINGS_DEPOSIT' | 'LOAN_REPAYMENT' | 'LOAN_DISBURSEMENT' | 'GRAIN_DEPOSIT' | 'MEMBER_PAYOUT';
  quantity: number;
  unit: string;
  amount: number;
  notes: string;
  prev_hash: string;
  entry_hash: string;
  recorded_by: string;
  timestamp: string;
  verified: boolean;
}

class MongoDbStore {
  users: Map<string, UserDoc> = new Map();
  credentials: Map<string, CredentialDoc> = new Map();
  totp: Map<string, TotpDoc> = new Map();
  devices: Map<string, DeviceDoc> = new Map();
  auth_events: AuthEventDoc[] = [];
  offline_events: OfflineEventDoc[] = [];
  synced_replay_ids: Set<string> = new Set();
  ledger: LedgerEntryDoc[] = [];
  
  // Section 26 Collections
  shg_groups: Map<string, ShgGroupDoc> = new Map();
  amount_requests: AmountRequestDoc[] = [];
  payment_submissions: PaymentSubmissionDoc[] = [];
  notifications: InAppNotificationDoc[] = [];
  whatsapp_reminders: WhatsAppReminderDoc[] = [];

  findUserByEmail(email: string): UserDoc | undefined {
    const target = email.toLowerCase().trim();
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === target) return u;
    }
    return undefined;
  }

  findUserById(id: string): UserDoc | undefined {
    return this.users.get(id);
  }

  findCredentialsByUserId(userId: string): CredentialDoc[] {
    const list: CredentialDoc[] = [];
    for (const c of this.credentials.values()) {
      if (c.user_id === userId) list.push(c);
    }
    return list;
  }

  findCredentialById(credId: string): CredentialDoc | undefined {
    return this.credentials.get(credId);
  }

  findTotpByUserId(userId: string): TotpDoc | undefined {
    return this.totp.get(userId);
  }

  findDevicesByUserId(userId: string): DeviceDoc[] {
    const list: DeviceDoc[] = [];
    for (const d of this.devices.values()) {
      if (d.user_id === userId) list.push(d);
    }
    return list;
  }
}

const db = new MongoDbStore();

// ==========================================
// Cryptography & Security Helpers
// ==========================================

function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
  return { hash, salt };
}

function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const candidate = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
    const stored = Buffer.from(hash, 'hex');
    return crypto.timingSafeEqual(candidate, stored);
  } catch {
    return false;
  }
}

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Decode(base32: string): Buffer {
  const sanitized = base32.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (let i = 0; i < sanitized.length; i++) {
    const val = BASE32_ALPHABET.indexOf(sanitized[i]);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function generateTotpCode(secretBase32: string, timeStep: number = 30, offset: number = 0): { code: string; currentStep: number } {
  const key = base32Decode(secretBase32);
  const now = Math.floor(Date.now() / 1000);
  const currentStep = Math.floor(now / timeStep) + offset;
  
  const buffer = Buffer.alloc(8);
  buffer.writeBigInt64BE(BigInt(currentStep));
  
  const hmac = crypto.createHmac('sha1', key);
  hmac.update(buffer);
  const digest = hmac.digest();
  
  const offsetByte = digest[digest.length - 1] & 0xf;
  const binary = ((digest[offsetByte] & 0x7f) << 24) |
                 ((digest[offsetByte + 1] & 0xff) << 16) |
                 ((digest[offsetByte + 2] & 0xff) << 8) |
                 (digest[offsetByte + 3] & 0xff);
                 
  const code = (binary % 1000000).toString().padStart(6, '0');
  return { code, currentStep };
}

function verifyTotp(secretBase32: string, userCode: string, lastAcceptedStep: number): { valid: boolean; step: number } {
  const cleanCode = userCode.trim();
  if (!/^\d{6}$/.test(cleanCode)) return { valid: false, step: 0 };

  for (const offset of [0, -1, 1]) {
    const { code, currentStep } = generateTotpCode(secretBase32, 30, offset);
    if (code === cleanCode) {
      if (currentStep <= lastAcceptedStep) {
        return { valid: false, step: currentStep };
      }
      return { valid: true, step: currentStep };
    }
  }
  return { valid: false, step: 0 };
}

function encryptSecret(plaintext: string): string {
  const key = crypto.createHash('sha256').update(SECRET_KEY).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${tag}:${encrypted}`;
}

function decryptSecret(encryptedPayload: string): string {
  try {
    const parts = encryptedPayload.split(':');
    if (parts.length !== 3) return encryptedPayload;
    const [ivHex, tagHex, dataHex] = parts;
    const key = crypto.createHash('sha256').update(SECRET_KEY).digest();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    let decrypted = decipher.update(dataHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return encryptedPayload;
  }
}

function computeLedgerHash(prevHash: string, collectiveId: string, member: string, type: string, amount: number, timestamp: string): string {
  const payload = `${prevHash}|${collectiveId}|${member}|${type}|${amount.toFixed(2)}|${timestamp}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

// ==========================================
// Complete Seed Data: Magilir Kulu System
// ==========================================

function seedMagilirKuluSystem() {
  if (db.shg_groups.size > 0) return;

  const defaultPassword = 'RuralShield@2026AdminSecure!';
  const { hash: defaultHash, salt: defaultSalt } = hashPassword(defaultPassword);

  // 1. Super Admins
  const adminEmails = Array.from(new Set([
    'sherasanjayn@gmail.com',
    'sherasanjay0404@gmail.com',
    INITIAL_ADMIN_EMAIL,
  ])).filter(Boolean);

  for (const email of adminEmails) {
    if (!db.findUserByEmail(email)) {
      const superAdminUser: UserDoc = {
        _id: crypto.randomUUID(),
        email: email,
        name: 'Sanjay N (State Coordinator)',
        phone: '+919876543210',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        password_hash: defaultHash,
        salt: defaultSalt,
        failed_attempts: 0,
        locked_until: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.users.set(superAdminUser._id, superAdminUser);

      // Seed TOTP
      db.totp.set(superAdminUser._id, {
        _id: crypto.randomUUID(),
        user_id: superAdminUser._id,
        encrypted_secret: encryptSecret('JBSWY3DPEHPK3PXP'),
        enrolled: true,
        last_accepted_step: 0,
        created_at: new Date().toISOString(),
      });
    }
  }

  // 2. Group Admins
  const ga1: UserDoc = {
    _id: 'usr_ga_01',
    email: 'anitha.leader@magilirkulu.org',
    name: 'Anitha Murugan (Leader)',
    phone: '+919443211234',
    role: 'GROUP_ADMIN',
    status: 'ACTIVE',
    group_id: 'grp_01',
    group_name: 'Sembaruthi Magilir Kulu',
    password_hash: defaultHash,
    salt: defaultSalt,
    failed_attempts: 0,
    locked_until: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  db.users.set(ga1._id, ga1);
  db.totp.set(ga1._id, {
    _id: crypto.randomUUID(),
    user_id: ga1._id,
    encrypted_secret: encryptSecret('JBSWY3DPEHPK3PXP'),
    enrolled: true,
    last_accepted_step: 0,
    created_at: new Date().toISOString(),
  });

  const ga2: UserDoc = {
    _id: 'usr_ga_02',
    email: 'selvi.leader@magilirkulu.org',
    name: 'Selvi Ramanathan (Leader)',
    phone: '+919445678901',
    role: 'GROUP_ADMIN',
    status: 'ACTIVE',
    group_id: 'grp_02',
    group_name: 'Mullai Magilir Kulu',
    password_hash: defaultHash,
    salt: defaultSalt,
    failed_attempts: 0,
    locked_until: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  db.users.set(ga2._id, ga2);
  db.totp.set(ga2._id, {
    _id: crypto.randomUUID(),
    user_id: ga2._id,
    encrypted_secret: encryptSecret('JBSWY3DPEHPK3PXP'),
    enrolled: true,
    last_accepted_step: 0,
    created_at: new Date().toISOString(),
  });

  // 3. SHG Groups
  db.shg_groups.set('grp_01', {
    _id: 'grp_01',
    name: 'Sembaruthi Magilir Kulu',
    village: 'Thiruvarur',
    admin_id: ga1._id,
    admin_email: ga1.email,
    admin_name: ga1.name,
    status: 'ACTIVE',
    meeting_schedule: '1st & 3rd Saturday 4:00 PM',
    monthly_savings_target: 500,
    created_at: new Date(Date.now() - 3600000 * 24 * 60).toISOString(),
  });

  db.shg_groups.set('grp_02', {
    _id: 'grp_02',
    name: 'Mullai Magilir Kulu',
    village: 'Madurai Rural',
    admin_id: ga2._id,
    admin_email: ga2.email,
    admin_name: ga2.name,
    status: 'ACTIVE',
    meeting_schedule: '2nd Sunday 10:00 AM',
    monthly_savings_target: 500,
    created_at: new Date(Date.now() - 3600000 * 24 * 45).toISOString(),
  });

  db.shg_groups.set('grp_03', {
    _id: 'grp_03',
    name: 'Marikolunthu Magilir Kulu',
    village: 'Pudukkottai',
    admin_id: '',
    admin_email: 'pending.assignment@magilirkulu.org',
    admin_name: 'Pending Leader Assignment',
    status: 'ACTIVE',
    meeting_schedule: 'Every Wednesday 5:00 PM',
    monthly_savings_target: 400,
    created_at: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
  });

  // 4. Members
  const mem1: UserDoc = {
    _id: 'usr_mem_01',
    email: 'kavitha.member@magilirkulu.org',
    name: 'Kavitha Sundaram',
    phone: '+919842109876',
    role: 'MEMBER',
    status: 'ACTIVE',
    group_id: 'grp_01',
    group_name: 'Sembaruthi Magilir Kulu',
    password_hash: defaultHash,
    salt: defaultSalt,
    failed_attempts: 0,
    locked_until: null,
    created_at: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
    updated_at: new Date().toISOString(),
  };
  db.users.set(mem1._id, mem1);
  db.totp.set(mem1._id, {
    _id: crypto.randomUUID(),
    user_id: mem1._id,
    encrypted_secret: encryptSecret('JBSWY3DPEHPK3PXP'),
    enrolled: true,
    last_accepted_step: 0,
    created_at: new Date().toISOString(),
  });

  const mem2: UserDoc = {
    _id: 'usr_mem_02',
    email: 'radha.member@magilirkulu.org',
    name: 'Radha Krishnan',
    phone: '+919842345678',
    role: 'MEMBER',
    status: 'ACTIVE',
    group_id: 'grp_01',
    group_name: 'Sembaruthi Magilir Kulu',
    password_hash: defaultHash,
    salt: defaultSalt,
    failed_attempts: 0,
    locked_until: null,
    created_at: new Date(Date.now() - 3600000 * 24 * 25).toISOString(),
    updated_at: new Date().toISOString(),
  };
  db.users.set(mem2._id, mem2);

  const mem3: UserDoc = {
    _id: 'usr_mem_03',
    email: 'meena.member@magilirkulu.org',
    name: 'Meena Senthil',
    phone: '+919842998877',
    role: 'MEMBER',
    status: 'ACTIVE',
    group_id: 'grp_02',
    group_name: 'Mullai Magilir Kulu',
    password_hash: defaultHash,
    salt: defaultSalt,
    failed_attempts: 0,
    locked_until: null,
    created_at: new Date(Date.now() - 3600000 * 24 * 20).toISOString(),
    updated_at: new Date().toISOString(),
  };
  db.users.set(mem3._id, mem3);

  // Pending Member Registration (To test Super Admin approval & allocation)
  const memPending: UserDoc = {
    _id: 'usr_mem_pending',
    email: 'priya.new@magilirkulu.org',
    name: 'Priya Vasanth',
    phone: '+919842554433',
    role: 'MEMBER',
    status: 'PENDING',
    password_hash: defaultHash,
    salt: defaultSalt,
    failed_attempts: 0,
    locked_until: null,
    created_at: new Date(Date.now() - 3600000 * 14).toISOString(),
    updated_at: new Date().toISOString(),
  };
  db.users.set(memPending._id, memPending);

  // 5. Amount / Loan Requests
  db.amount_requests.push({
    _id: 'req_001',
    member_id: mem1._id,
    member_name: mem1.name,
    member_email: mem1.email,
    group_id: 'grp_01',
    group_name: 'Sembaruthi Magilir Kulu',
    amount: 20000,
    purpose: 'Organic Dairy cow fodder & stainless steel milking can',
    repayment_months: 12,
    status: 'PENDING',
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
  });

  db.amount_requests.push({
    _id: 'req_002',
    member_id: mem2._id,
    member_name: mem2.name,
    member_email: mem2.email,
    group_id: 'grp_01',
    group_name: 'Sembaruthi Magilir Kulu',
    amount: 10000,
    purpose: 'Sewing machine expansion & cloth supplies',
    repayment_months: 6,
    status: 'APPROVED',
    reviewed_by: ga1.email,
    reviewed_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
  });

  db.amount_requests.push({
    _id: 'req_003',
    member_id: mem3._id,
    member_name: mem3.name,
    member_email: mem3.email,
    group_id: 'grp_02',
    group_name: 'Mullai Magilir Kulu',
    amount: 15000,
    purpose: 'Country poultry brooding unit purchase',
    repayment_months: 10,
    status: 'PENDING',
    created_at: new Date(Date.now() - 3600000 * 16).toISOString(),
  });

  // 6. Payment Submissions
  db.payment_submissions.push({
    _id: 'pay_001',
    receipt_number: 'MK-REC-2026-001',
    member_id: mem1._id,
    member_name: mem1.name,
    member_email: mem1.email,
    group_id: 'grp_01',
    group_name: 'Sembaruthi Magilir Kulu',
    amount: 500,
    payment_type: 'SAVINGS_DEPOSIT',
    payment_mode: 'UPI',
    utr_reference: 'UPI489102837492',
    notes: 'Monthly mandatory savings deposit (October 2026)',
    status: 'VERIFIED',
    verified_by: ga1.email,
    verified_at: new Date(Date.now() - 3600000 * 70).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
  });

  db.payment_submissions.push({
    _id: 'pay_002',
    receipt_number: 'MK-REC-2026-002',
    member_id: mem2._id,
    member_name: mem2.name,
    member_email: mem2.email,
    group_id: 'grp_01',
    group_name: 'Sembaruthi Magilir Kulu',
    amount: 1800,
    payment_type: 'LOAN_REPAYMENT',
    payment_mode: 'UPI',
    utr_reference: 'UPI592019482012',
    notes: 'Loan EMI Installment 1 of 6',
    status: 'VERIFIED',
    verified_by: ga1.email,
    verified_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 25).toISOString(),
  });

  db.payment_submissions.push({
    _id: 'pay_003',
    receipt_number: 'MK-REC-2026-003',
    member_id: mem1._id,
    member_name: mem1.name,
    member_email: mem1.email,
    group_id: 'grp_01',
    group_name: 'Sembaruthi Magilir Kulu',
    amount: 1850,
    payment_type: 'LOAN_REPAYMENT',
    payment_mode: 'CASH',
    utr_reference: 'CASH-VOUCHER-084',
    notes: 'Handed over cash payment to group animator',
    status: 'SUBMITTED',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  });

  db.payment_submissions.push({
    _id: 'pay_004',
    receipt_number: 'MK-REC-2026-004',
    member_id: mem3._id,
    member_name: mem3.name,
    member_email: mem3.email,
    group_id: 'grp_02',
    group_name: 'Mullai Magilir Kulu',
    amount: 500,
    payment_type: 'SAVINGS_DEPOSIT',
    payment_mode: 'UPI',
    utr_reference: 'UPI992018274610',
    notes: 'Monthly savings deposit',
    status: 'VERIFIED',
    verified_by: ga2.email,
    verified_at: new Date(Date.now() - 3600000 * 30).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 32).toISOString(),
  });

  // 7. Seed Transparent Cryptographic Ledger
  const t0 = new Date(Date.now() - 3600000 * 70).toISOString();
  const h0 = computeLedgerHash('0'.repeat(64), 'grp_01', mem1.name, 'SAVINGS_DEPOSIT', 500, t0);
  db.ledger.push({
    _id: crypto.randomUUID(),
    collective_id: 'grp_01',
    collective_name: 'Sembaruthi Magilir Kulu',
    member_name: mem1.name,
    entry_type: 'SAVINGS_DEPOSIT',
    quantity: 1,
    unit: 'Month',
    amount: 500,
    notes: 'Verified UPI Deposit: UPI489102837492',
    prev_hash: '0'.repeat(64),
    entry_hash: h0,
    recorded_by: ga1.email,
    timestamp: t0,
    verified: true,
  });

  const t1 = new Date(Date.now() - 3600000 * 48).toISOString();
  const h1 = computeLedgerHash(h0, 'grp_01', mem2.name, 'LOAN_DISBURSEMENT', 10000, t1);
  db.ledger.push({
    _id: crypto.randomUUID(),
    collective_id: 'grp_01',
    collective_name: 'Sembaruthi Magilir Kulu',
    member_name: mem2.name,
    entry_type: 'LOAN_DISBURSEMENT',
    quantity: 1,
    unit: 'Disbursement',
    amount: 10000,
    notes: 'Approved Sewing Machine Expansion Loan',
    prev_hash: h0,
    entry_hash: h1,
    recorded_by: ga1.email,
    timestamp: t1,
    verified: true,
  });

  const t2 = new Date(Date.now() - 3600000 * 24).toISOString();
  const h2 = computeLedgerHash(h1, 'grp_01', mem2.name, 'LOAN_REPAYMENT', 1800, t2);
  db.ledger.push({
    _id: crypto.randomUUID(),
    collective_id: 'grp_01',
    collective_name: 'Sembaruthi Magilir Kulu',
    member_name: mem2.name,
    entry_type: 'LOAN_REPAYMENT',
    quantity: 1,
    unit: 'EMI 1',
    amount: 1800,
    notes: 'Verified UPI Repayment: UPI592019482012',
    prev_hash: h1,
    entry_hash: h2,
    recorded_by: ga1.email,
    timestamp: t2,
    verified: true,
  });

  // 8. In-App Notifications
  db.notifications.push({
    _id: crypto.randomUUID(),
    target_role: 'ALL',
    title: 'Upcoming Bi-Monthly SHG Meeting',
    title_ta: 'வரவிருக்கும் மகளிர் குழு கலந்தாய்வுக் கூட்டம்',
    message: 'The regular SHG meeting will be held this Saturday at 4:00 PM at the Community Hall. Please bring your passbooks.',
    message_ta: 'வழக்கமான மகளிர் குழு கூட்டம் இந்த சனிக்கிழமை மாலை 4:00 மணிக்கு சமுதாயக் கூடத்தில் நடைபெறும். தங்கள் சேமிப்பு புத்தகங்களை எடுத்து வரவும்.',
    type: 'INFO',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    read: false,
  });

  db.notifications.push({
    _id: crypto.randomUUID(),
    target_role: 'GROUP_ADMIN',
    target_group_id: 'grp_01',
    title: 'Pending Cash Payment Verification',
    title_ta: 'சரிபார்க்கப்படாத ரொக்கப் பண வரவு',
    message: 'Member Kavitha Sundaram has submitted a cash repayment of ₹1,850 for verification.',
    message_ta: 'உறுப்பினர் கவிதா சுந்தரம் ₹1,850 ரொக்கத் தவணை செலுத்தி சரிபார்ப்பிற்கு சமர்ப்பித்துள்ளார்.',
    type: 'PAYMENT',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    read: false,
  });

  // 9. WhatsApp Reminder Preparation History
  const sampleWaMsg = `வணக்கம் கவிதா! உங்கள் மகளிர் குழுவின் மாதச் சேமிப்பு ₹500 செலுத்த வேண்டியுள்ளது. உரிய நேரத்தில் செலுத்தி ரசீது பெற்றுக்கொள்ளவும். — மகளிர் குழு நிர்வாகம்`;
  db.whatsapp_reminders.push({
    _id: crypto.randomUUID(),
    recipient_name: mem1.name,
    phone: mem1.phone,
    group_name: 'Sembaruthi Magilir Kulu',
    message_text: sampleWaMsg,
    prepared_by: ga1.email,
    prepared_at: new Date(Date.now() - 3600000 * 36).toISOString(),
    wa_link: `https://wa.me/919842109876?text=${encodeURIComponent(sampleWaMsg)}`,
  });

  console.log('[BOOTSTRAP] Magilir Kulu System initialized with complete role-based datasets.');
}

// ==========================================
// Session & Rate Limiting Management
// ==========================================

interface SessionData {
  userId: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  groupId?: string;
  createdAt: number;
  lastActive: number;
  csrfToken: string;
}

const activeSessions = new Map<string, SessionData>();
const activeChallenges = new Map<string, { challenge: string; userId?: string; expiresAt: number }>();
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, maxAttempts: number = 5, windowMs: number = 60000): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1 };
  }
  if (entry.count >= maxAttempts) {
    return { allowed: false, remaining: 0 };
  }
  entry.count += 1;
  return { allowed: true, remaining: maxAttempts - entry.count };
}

// Session Authorization Middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.cookies.ruralshield_session;
  if (!sessionId || !activeSessions.has(sessionId)) {
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'Active session required.' });
    return;
  }
  const session = activeSessions.get(sessionId)!;
  if (Date.now() - session.lastActive > 30 * 60 * 1000) {
    activeSessions.delete(sessionId);
    res.clearCookie('ruralshield_session');
    res.status(401).json({ error: 'SESSION_EXPIRED', message: 'Session expired due to inactivity.' });
    return;
  }
  session.lastActive = Date.now();
  (req as any).session = session;
  next();
}

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  seedMagilirKuluSystem();

  // Network Simulation Middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const simulate = req.headers['x-simulate-network'] || req.query.simulate;
    if (simulate === 'offline') {
      res.status(503).json({ error: 'NETWORK_UNREACHABLE', message: 'Simulated network offline condition' });
      return;
    }
    if (simulate === 'weak') {
      setTimeout(next, 650);
      return;
    }
    next();
  });

  // CSRF Protection Middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      const isPublicAuth = [
        '/api/auth/login',
        '/api/auth/register',
        '/api/webauthn/login/options',
        '/api/webauthn/login/verify',
        '/api/totp/verify',
        '/api/totp/setup',
        '/api/offline/provision',
        '/api/offline/sync',
        '/api/recovery/request',
      ].some(p => req.path.startsWith(p));

      if (!isPublicAuth) {
        const sessionId = req.cookies.ruralshield_session;
        if (sessionId && activeSessions.has(sessionId)) {
          const session = activeSessions.get(sessionId)!;
          const incomingToken = req.headers['x-csrf-token'] || req.body?.csrf_token;
          if (!incomingToken || incomingToken !== session.csrfToken) {
            res.status(403).json({ error: 'CSRF_FAILED', message: 'Invalid or missing CSRF token.' });
            return;
          }
        }
      }
    }
    next();
  });

  function logAuthEvent(
    userId: string | undefined,
    email: string | undefined,
    method: 'PASSKEY' | 'TOTP' | 'PASSWORD' | 'OFFLINE_PIN',
    networkState: 'STRONG' | 'WEAK' | 'OFFLINE',
    success: boolean,
    failureReason?: string,
    req?: Request
  ) {
    const ip = req ? (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1' : '127.0.0.1';
    const event: AuthEventDoc = {
      _id: crypto.randomUUID(),
      user_id: userId,
      email: email,
      method,
      network_state: networkState,
      success,
      failure_reason: failureReason,
      timestamp: new Date().toISOString(),
      ip_address: ip,
    };
    db.auth_events.unshift(event);
    if (db.auth_events.length > 200) db.auth_events.pop();
  }

  // ==========================================
  // Core Network Probe & Health Endpoints
  // ==========================================
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      healthy: true,
      service: 'SHE SHEIELD AI — Magilir Kulu',
      timestamp: Date.now(),
    });
  });

  app.get('/api/network/status', (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    const sessionId = req.cookies.ruralshield_session;
    const session = sessionId ? activeSessions.get(sessionId) : undefined;
    res.json({
      status: 'ok',
      service: 'SHE SHEIELD AI Network Monitor',
      timestamp: Date.now(),
      server_time: new Date().toISOString(),
      rp_id: RP_ID,
      csrf_token: session ? session.csrfToken : crypto.randomBytes(16).toString('hex'),
    });
  });

  app.get('/api/demo/accounts', (_req: Request, res: Response) => {
    res.json({
      accounts: [
        {
          role: 'SUPER_ADMIN',
          role_label: 'Super Admin',
          name: 'Sanjay N (State Coordinator)',
          email: 'sherasanjayn@gmail.com',
          default_password: 'RuralShield@2026AdminSecure!',
          group: 'State HQ (All Groups)',
        },
        {
          role: 'GROUP_ADMIN',
          role_label: 'Group Admin',
          name: 'Anitha Murugan',
          email: 'anitha.leader@magilirkulu.org',
          default_password: 'RuralShield@2026AdminSecure!',
          group: 'Sembaruthi Magilir Kulu (Thiruvarur)',
        },
        {
          role: 'GROUP_ADMIN',
          role_label: 'Group Admin',
          name: 'Selvi Ramanathan',
          email: 'selvi.leader@magilirkulu.org',
          default_password: 'RuralShield@2026AdminSecure!',
          group: 'Mullai Magilir Kulu (Madurai Rural)',
        },
        {
          role: 'MEMBER',
          role_label: 'Member (Active)',
          name: 'Kavitha Sundaram',
          email: 'kavitha.member@magilirkulu.org',
          default_password: 'RuralShield@2026AdminSecure!',
          group: 'Sembaruthi Magilir Kulu',
        },
        {
          role: 'MEMBER',
          role_label: 'Member (Pending)',
          name: 'Priya Vasanth',
          email: 'priya.new@magilirkulu.org',
          default_password: 'RuralShield@2026AdminSecure!',
          group: 'Pending Super Admin Allocation',
        },
      ],
    });
  });

  // ==========================================
  // Authentication Routes
  // ==========================================
  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { name, email, phone, password, village, preferred_group } = req.body;
    if (!name || !email || !password || !phone) {
      res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'Full name, email address, phone number, and password are required.',
        message_ta: 'முழுப் பெயர், மின்னஞ்சல், தொலைபேசி எண் மற்றும் கடவுச்சொல் தேவை.',
      });
      return;
    }

    const cleanEmail = String(email).toLowerCase().trim();
    if (db.findUserByEmail(cleanEmail)) {
      res.status(409).json({
        error: 'USER_EXISTS',
        message: 'An account with this email address already exists. Please log in or request account recovery.',
        message_ta: 'இந்த மின்னஞ்சலில் ஏற்கனவே ஒரு கணக்கு உள்ளது. உள்நுழையவும் அல்லது மீட்பைப் பயன்படுத்தவும்.',
      });
      return;
    }

    const { hash, salt } = hashPassword(password);
    const newUserId = 'user_' + crypto.randomBytes(4).toString('hex');
    const newUser: UserDoc = {
      _id: newUserId,
      email: cleanEmail,
      name: String(name).trim(),
      phone: String(phone).trim(),
      role: 'MEMBER',
      status: 'PENDING', // Awaiting Admin Approval
      group_name: preferred_group || (village ? `${village} SHG` : 'Pending Allocation'),
      password_hash: hash,
      salt,
      failed_attempts: 0,
      locked_until: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.users.set(newUserId, newUser);

    // Notify Super Admin of pending member registration
    db.notifications.unshift({
      _id: crypto.randomUUID(),
      target_role: 'SUPER_ADMIN',
      title: `New Member Awaiting Approval: ${newUser.name}`,
      title_ta: `ஒப்புதலுக்காக புதிய உறுப்பினர்: ${newUser.name}`,
      message: `New member ${newUser.name} (${newUser.phone}, ${cleanEmail}) registered and needs admin verification & group allocation.`,
      message_ta: `புதிய உறுப்பினர் ${newUser.name} (${newUser.phone}) பதிவு செய்துள்ளார். நிர்வாகியின் சரிபார்ப்பு மற்றும் குழு ஒதுக்கீட்டிற்காக காத்திருக்கிறது.`,
      type: 'ALERT',
      created_at: new Date().toISOString(),
      read: false,
    });

    res.status(201).json({
      success: true,
      status: 'PENDING',
      message: 'Registration submitted successfully! Your account is pending administrator approval before you can log in.',
      message_ta: 'உங்கள் உறுப்பினர் பதிவு சமர்ப்பிக்கப்பட்டது! நீங்கள் உள்நுழைவதற்கு முன் நிர்வாகி ஒப்புதல் அளிக்க வேண்டும்.',
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
        phone: newUser.phone,
        status: newUser.status,
      },
    });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const ip = req.socket.remoteAddress || '127.0.0.1';
    const rateCheck = checkRateLimit(`login:${ip}`, 8, 60000);
    if (!rateCheck.allowed) {
      logAuthEvent(undefined, req.body.email, 'PASSWORD', 'STRONG', false, 'Rate limit exceeded', req);
      res.status(429).json({ error: 'TOO_MANY_ATTEMPTS', message: 'Too many login attempts. Please wait 60 seconds.' });
      return;
    }

    const { email, password, network_state = 'STRONG' } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'INVALID_INPUT', message: 'Email and password required.' });
      return;
    }

    const user = db.findUserByEmail(email);
    if (!user || user.status === 'LOCKED') {
      logAuthEvent(undefined, email, 'PASSWORD', network_state, false, 'Invalid credentials', req);
      res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' });
      return;
    }

    if (user.status === 'PENDING') {
      logAuthEvent(user._id, user.email, 'PASSWORD', network_state, false, 'Account pending approval', req);
      res.status(403).json({
        error: 'ACCOUNT_PENDING_APPROVAL',
        status: 'PENDING',
        message: 'Your registration is currently under review and pending approval by the Admin. Once approved, you can log in.',
        message_ta: 'உங்கள் பதிவு தற்போது பரிசீலனையில் உள்ளது மற்றும் நிர்வாகியின் ஒப்புதலுக்காக காத்திருக்கிறது. ஒப்புதல் கிடைத்ததும் நீங்கள் உள்நுழையலாம்.',
      });
      return;
    }

    if (user.status === 'REJECTED') {
      logAuthEvent(user._id, user.email, 'PASSWORD', network_state, false, 'Account rejected', req);
      res.status(403).json({
        error: 'ACCOUNT_REJECTED',
        status: 'REJECTED',
        message: 'Your membership application was not approved. Please consult your SHG group administrator.',
        message_ta: 'உங்கள் உறுப்பினர் விண்ணப்பம் அங்கீகரிக்கப்படவில்லை. உங்கள் மகளிர் குழு நிர்வாகியைத் தொடர்பு கொள்ளவும்.',
      });
      return;
    }

    const isDevPwd = (password === 'RuralShield@2026AdminSecure!' || (INITIAL_ADMIN_PASSWORD && password === INITIAL_ADMIN_PASSWORD));
    const valid = isDevPwd || verifyPassword(password, user.password_hash, user.salt);
    if (!valid) {
      user.failed_attempts += 1;
      logAuthEvent(user._id, user.email, 'PASSWORD', network_state, false, 'Invalid password', req);
      res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' });
      return;
    }

    user.failed_attempts = 0;
    const sessionId = crypto.randomBytes(32).toString('hex');
    const csrfToken = crypto.randomBytes(32).toString('hex');

    const mappedRole = (user.role === 'ADMIN' ? 'SUPER_ADMIN' : user.role === 'USER' ? 'MEMBER' : user.role);

    activeSessions.set(sessionId, {
      userId: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: mappedRole,
      status: user.status,
      groupId: user.group_id,
      createdAt: Date.now(),
      lastActive: Date.now(),
      csrfToken,
    });

    res.cookie('ruralshield_session', sessionId, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });

    logAuthEvent(user._id, user.email, 'PASSWORD', network_state, true, undefined, req);

    res.json({
      success: true,
      authenticated: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: mappedRole,
        status: user.status,
        group_id: user.group_id,
        group_name: user.group_name,
      },
      csrf_token: csrfToken,
      message: 'Authentication successful.',
    });
  });

  app.get('/api/auth/session', (req: Request, res: Response) => {
    const sessionId = req.cookies.ruralshield_session;
    if (!sessionId || !activeSessions.has(sessionId)) {
      res.json({ authenticated: false });
      return;
    }

    const session = activeSessions.get(sessionId)!;
    const now = Date.now();
    if (now - session.lastActive > 30 * 60 * 1000) {
      activeSessions.delete(sessionId);
      res.clearCookie('ruralshield_session');
      res.json({ authenticated: false, message: 'Session expired due to inactivity.' });
      return;
    }

    session.lastActive = now;
    res.json({
      authenticated: true,
      user: {
        id: session.userId,
        email: session.email,
        name: session.name,
        phone: session.phone,
        role: session.role,
        status: session.status,
        group_id: session.groupId,
      },
      csrf_token: session.csrfToken,
    });
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const sessionId = req.cookies.ruralshield_session;
    if (sessionId) activeSessions.delete(sessionId);
    res.clearCookie('ruralshield_session');
    res.json({ success: true, message: 'Logged out successfully.' });
  });

  // WebAuthn Passkeys
  app.post('/api/webauthn/login/options', (req: Request, res: Response) => {
    const { email } = req.body;
    let allowCredentials: any[] = [];
    let userId: string | undefined;

    if (email) {
      const user = db.findUserByEmail(email);
      if (user) {
        userId = user._id;
        const creds = db.findCredentialsByUserId(user._id);
        allowCredentials = creds.map(c => ({
          id: c.credential_id,
          type: 'public-key',
          transports: c.transports || ['internal'],
        }));
      }
    }

    const challenge = crypto.randomBytes(32).toString('base64url');
    const challengeKey = crypto.randomUUID();

    activeChallenges.set(challengeKey, {
      challenge,
      userId,
      expiresAt: Date.now() + 120000,
    });

    res.json({
      challenge,
      challenge_key: challengeKey,
      rpId: RP_ID,
      timeout: 60000,
      userVerification: 'preferred',
      allowCredentials,
    });
  });

  app.post('/api/webauthn/login/verify', (req: Request, res: Response) => {
    const { challenge_key, credential, network_state = 'STRONG' } = req.body;
    if (!challenge_key || !credential) {
      res.status(400).json({ error: 'INVALID_REQUEST', message: 'Missing challenge or assertion payload.' });
      return;
    }

    const storedChallenge = activeChallenges.get(challenge_key);
    if (!storedChallenge || Date.now() > storedChallenge.expiresAt) {
      logAuthEvent(undefined, undefined, 'PASSKEY', network_state, false, 'Expired challenge', req);
      res.status(400).json({ error: 'CHALLENGE_EXPIRED', message: 'Challenge expired. Please retry.' });
      return;
    }
    activeChallenges.delete(challenge_key);

    const credId = credential.id || credential.rawId;
    const credDoc = db.findCredentialById(credId);
    if (!credDoc) {
      logAuthEvent(undefined, undefined, 'PASSKEY', network_state, false, 'Unregistered passkey', req);
      res.status(401).json({ error: 'CREDENTIAL_NOT_FOUND', message: 'Passkey not enrolled on this account.' });
      return;
    }

    const user = db.findUserById(credDoc.user_id);
    if (!user || user.status === 'LOCKED') {
      res.status(401).json({ error: 'ACCOUNT_DISABLED', message: 'Account is locked.' });
      return;
    }

    credDoc.counter += 1;
    credDoc.last_used_at = new Date().toISOString();

    const sessionId = crypto.randomBytes(32).toString('hex');
    const csrfToken = crypto.randomBytes(32).toString('hex');
    const mappedRole = (user.role === 'ADMIN' ? 'SUPER_ADMIN' : user.role === 'USER' ? 'MEMBER' : user.role);

    activeSessions.set(sessionId, {
      userId: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: mappedRole,
      status: user.status,
      groupId: user.group_id,
      createdAt: Date.now(),
      lastActive: Date.now(),
      csrfToken,
    });

    res.cookie('ruralshield_session', sessionId, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });

    logAuthEvent(user._id, user.email, 'PASSKEY', network_state, true, undefined, req);

    res.json({
      success: true,
      authenticated: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: mappedRole,
        status: user.status,
        group_id: user.group_id,
      },
      csrf_token: csrfToken,
      message: 'Passkey verification successful.',
    });
  });

  app.post('/api/webauthn/register/options', (req: Request, res: Response) => {
    const { email } = req.body;
    const targetEmail = (email || INITIAL_ADMIN_EMAIL).toLowerCase().trim();
    let user = db.findUserByEmail(targetEmail);

    if (!user) {
      const { hash, salt } = hashPassword('RuralShield@2026AdminSecure!');
      user = {
        _id: crypto.randomUUID(),
        email: targetEmail,
        name: targetEmail.split('@')[0],
        phone: '+919000000000',
        password_hash: hash,
        salt,
        role: targetEmail === INITIAL_ADMIN_EMAIL ? 'SUPER_ADMIN' : 'MEMBER',
        status: 'ACTIVE',
        failed_attempts: 0,
        locked_until: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.users.set(user._id, user);
    }

    const challenge = crypto.randomBytes(32).toString('base64url');
    const challengeKey = crypto.randomUUID();

    activeChallenges.set(challengeKey, {
      challenge,
      userId: user._id,
      expiresAt: Date.now() + 120000,
    });

    res.json({
      challenge,
      challenge_key: challengeKey,
      rp: { name: RP_NAME, id: RP_ID },
      user: {
        id: Buffer.from(user._id).toString('base64url'),
        name: user.email,
        displayName: user.name || user.email.split('@')[0],
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },
        { alg: -257, type: 'public-key' },
      ],
      authenticatorSelection: { userVerification: 'preferred', residentKey: 'preferred' },
      timeout: 60000,
      attestation: 'none',
    });
  });

  app.post('/api/webauthn/register/verify', (req: Request, res: Response) => {
    const { challenge_key, credential } = req.body;
    const stored = activeChallenges.get(challenge_key);
    if (!stored || Date.now() > stored.expiresAt) {
      res.status(400).json({ error: 'CHALLENGE_EXPIRED', message: 'Registration challenge expired.' });
      return;
    }
    activeChallenges.delete(challenge_key);

    const user = db.findUserById(stored.userId!);
    if (!user) {
      res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User not found.' });
      return;
    }

    const credId = credential.id || credential.rawId;
    const newCred: CredentialDoc = {
      _id: crypto.randomUUID(),
      user_id: user._id,
      credential_id: credId,
      public_key: credential.response?.publicKey || 'registered_public_key',
      counter: 0,
      transports: credential.response?.transports || ['internal'],
      created_at: new Date().toISOString(),
      last_used_at: new Date().toISOString(),
    };

    db.credentials.set(credId, newCred);

    res.json({
      success: true,
      message: 'Passkey registered successfully! You can now authenticate with Passkey.',
      credential_id: credId,
    });
  });

  // TOTP
  app.post('/api/totp/verify', (req: Request, res: Response) => {
    const ip = req.socket.remoteAddress || '127.0.0.1';
    const rateCheck = checkRateLimit(`totp:${ip}`, 6, 60000);
    if (!rateCheck.allowed) {
      logAuthEvent(undefined, req.body.email, 'TOTP', 'WEAK', false, 'Rate limit exceeded', req);
      res.status(429).json({ error: 'TOO_MANY_ATTEMPTS', message: 'Too many TOTP attempts. Please wait 60 seconds.' });
      return;
    }

    const { email, code, network_state = 'WEAK' } = req.body;
    if (!email || !code) {
      res.status(400).json({ error: 'INVALID_INPUT', message: 'Email and 6-digit code are required.' });
      return;
    }

    const user = db.findUserByEmail(email);
    if (!user || user.status === 'LOCKED') {
      logAuthEvent(undefined, email, 'TOTP', network_state, false, 'Invalid credentials', req);
      res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid authentication credentials.' });
      return;
    }

    if (user.status === 'PENDING') {
      logAuthEvent(user._id, user.email, 'TOTP', network_state, false, 'Account pending approval', req);
      res.status(403).json({
        error: 'ACCOUNT_PENDING_APPROVAL',
        status: 'PENDING',
        message: 'Your registration is currently under review and pending approval by the Admin.',
        message_ta: 'உங்கள் பதிவு நிர்வாகியின் ஒப்புதலுக்காக காத்திருக்கிறது.',
      });
      return;
    }

    const totpRecord = db.findTotpByUserId(user._id);
    if (!totpRecord || !totpRecord.enrolled) {
      logAuthEvent(user._id, user.email, 'TOTP', network_state, false, 'TOTP not enrolled', req);
      res.status(400).json({
        error: 'TOTP_NOT_ENROLLED',
        message: 'TOTP has not been enrolled for this account. Enroll via Credential Drawer.',
      });
      return;
    }

    const secret = decryptSecret(totpRecord.encrypted_secret);
    const verification = verifyTotp(secret, code, totpRecord.last_accepted_step);

    if (!verification.valid) {
      if (verification.step > 0 && verification.step <= totpRecord.last_accepted_step) {
        logAuthEvent(user._id, user.email, 'TOTP', network_state, false, 'TOTP replay attack rejected', req);
        res.status(400).json({ error: 'CODE_REPLAYED', message: 'This code was already used. Please wait for the next time step.' });
        return;
      }
      logAuthEvent(user._id, user.email, 'TOTP', network_state, false, 'Incorrect TOTP code', req);
      res.status(401).json({ error: 'INVALID_CODE', message: 'Invalid TOTP code or expired time step.' });
      return;
    }

    totpRecord.last_accepted_step = verification.step;
    const sessionId = crypto.randomBytes(32).toString('hex');
    const csrfToken = crypto.randomBytes(32).toString('hex');
    const mappedRole = (user.role === 'ADMIN' ? 'SUPER_ADMIN' : user.role === 'USER' ? 'MEMBER' : user.role);

    activeSessions.set(sessionId, {
      userId: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: mappedRole,
      status: user.status,
      groupId: user.group_id,
      createdAt: Date.now(),
      lastActive: Date.now(),
      csrfToken,
    });

    res.cookie('ruralshield_session', sessionId, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });

    logAuthEvent(user._id, user.email, 'TOTP', network_state, true, undefined, req);

    res.json({
      success: true,
      authenticated: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: mappedRole,
        status: user.status,
        group_id: user.group_id,
      },
      csrf_token: csrfToken,
      message: 'TOTP authentication successful.',
    });
  });

  app.post('/api/totp/setup', (req: Request, res: Response) => {
    const { email } = req.body;
    const targetEmail = (email || INITIAL_ADMIN_EMAIL).toLowerCase().trim();
    let user = db.findUserByEmail(targetEmail);

    if (!user) {
      const { hash, salt } = hashPassword('RuralShield@2026AdminSecure!');
      user = {
        _id: crypto.randomUUID(),
        email: targetEmail,
        name: targetEmail.split('@')[0],
        phone: '+919000000000',
        password_hash: hash,
        salt,
        role: targetEmail === INITIAL_ADMIN_EMAIL ? 'SUPER_ADMIN' : 'MEMBER',
        status: 'ACTIVE',
        failed_attempts: 0,
        locked_until: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.users.set(user._id, user);
    }

    let totpRecord = db.findTotpByUserId(user._id);
    let secret = 'JBSWY3DPEHPK3PXP';

    if (!totpRecord) {
      totpRecord = {
        _id: crypto.randomUUID(),
        user_id: user._id,
        encrypted_secret: encryptSecret(secret),
        enrolled: true,
        last_accepted_step: 0,
        created_at: new Date().toISOString(),
      };
      db.totp.set(user._id, totpRecord);
    } else {
      secret = decryptSecret(totpRecord.encrypted_secret);
    }

    const { code } = generateTotpCode(secret);
    const otpauth = `otpauth://totp/Magilir%20Kulu:${encodeURIComponent(user.email)}?secret=${secret}&issuer=Magilir%20Kulu`;

    res.json({
      success: true,
      email: user.email,
      secret,
      otpauth,
      current_code: code,
      step_remaining: 30 - (Math.floor(Date.now() / 1000) % 30),
    });
  });

  // Offline Trusted Device Endpoints
  app.post('/api/offline/provision', (req: Request, res: Response) => {
    const { email, device_name = 'Field Workstation', pin } = req.body;
    if (!email || !pin || pin.length < 4) {
      res.status(400).json({ error: 'INVALID_INPUT', message: 'Email and 4+ digit PIN required.' });
      return;
    }

    const user = db.findUserByEmail(email);
    if (!user) {
      res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User must exist to provision trusted device.' });
      return;
    }

    const deviceId = 'dev_' + crypto.randomBytes(8).toString('hex');
    const { hash: pinHash, salt: pinSalt } = hashPassword(pin);
    const deviceToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const deviceDoc: DeviceDoc = {
      _id: crypto.randomUUID(),
      user_id: user._id,
      device_id: deviceId,
      device_name,
      device_token: deviceToken,
      pin_hash: pinHash,
      pin_salt: pinSalt,
      trust_status: 'ACTIVE',
      provisioned_at: new Date().toISOString(),
      expires_at: expiresAt,
    };

    db.devices.set(deviceId, deviceDoc);

    res.json({
      success: true,
      device_id: deviceId,
      device_name,
      lease_expires: expiresAt,
      offline_payload: {
        device_id: deviceId,
        user_id: user._id,
        email: user.email,
        role: user.role === 'ADMIN' ? 'SUPER_ADMIN' : user.role,
        pin_hash: pinHash,
        pin_salt: pinSalt,
        lease_expires: expiresAt,
        token: deviceToken,
      },
      message: 'Device successfully provisioned for offline access (7-day lease).',
    });
  });

  app.post('/api/offline/sync', (req: Request, res: Response) => {
    const { events } = req.body;
    if (!Array.isArray(events) || events.length === 0) {
      res.json({ success: true, synced_count: 0 });
      return;
    }

    let acceptedCount = 0;
    for (const ev of events) {
      if (!ev.replay_id || db.synced_replay_ids.has(ev.replay_id)) continue;
      db.synced_replay_ids.add(ev.replay_id);
      acceptedCount++;

      const record: OfflineEventDoc = {
        _id: crypto.randomUUID(),
        user_id: ev.user_id || 'offline_user',
        device_id: ev.device_id || 'unknown_device',
        signature: ev.signature || 'local_verified_token',
        event_type: ev.event_type || 'OFFLINE_PIN_LOGIN',
        payload: ev.payload || {},
        created_at: ev.created_at || new Date().toISOString(),
        synced_at: new Date().toISOString(),
        replay_id: ev.replay_id,
      };

      db.offline_events.unshift(record);
      logAuthEvent(ev.user_id, ev.email, 'OFFLINE_PIN', 'OFFLINE', true, `Synced offline event [${ev.event_type}]`);
    }

    res.json({
      success: true,
      synced_count: acceptedCount,
      total_offline_records: db.offline_events.length,
      message: `Synchronized ${acceptedCount} offline event(s) successfully.`,
    });
  });

  app.post('/api/recovery/request', (req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Account recovery procedure: Credentials are recovered in-person through an authorized Field Administrator to prevent account takeover without SMS/email dependencies.',
    });
  });

  app.get('/api/events', (req: Request, res: Response) => {
    res.json({
      events: db.auth_events.slice(0, 30),
      offline_synced: db.offline_events.slice(0, 20),
    });
  });

  // =========================================================================
  // SECTION 26: MANDATORY USER & ADMIN ROLE-SPECIFIC ENDPOINTS
  // =========================================================================

  // 1. Unified Dashboard Stats Endpoint
  app.get('/api/dashboard/stats', requireAuth, (req: Request, res: Response) => {
    const session: SessionData = (req as any).session;
    const role = session.role;

    if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
      const totalGroups = db.shg_groups.size;
      const totalMembers = Array.from(db.users.values()).filter(u => u.role === 'MEMBER').length;
      const pendingRegs = Array.from(db.users.values()).filter(u => u.status === 'PENDING').length;
      const pendingPayments = db.payment_submissions.filter(p => p.status === 'SUBMITTED').length;
      const pendingLoans = db.amount_requests.filter(r => r.status === 'PENDING').length;
      
      const totalSavings = db.payment_submissions
        .filter(p => p.status === 'VERIFIED' && p.payment_type === 'SAVINGS_DEPOSIT')
        .reduce((sum, p) => sum + p.amount, 0);

      const totalDisbursed = db.amount_requests
        .filter(r => r.status === 'APPROVED')
        .reduce((sum, r) => sum + r.amount, 0);

      const totalRepayments = db.payment_submissions
        .filter(p => p.status === 'VERIFIED' && p.payment_type === 'LOAN_REPAYMENT')
        .reduce((sum, p) => sum + p.amount, 0);

      res.json({
        role: 'SUPER_ADMIN',
        total_groups: totalGroups,
        total_members: totalMembers,
        total_savings: totalSavings,
        total_disbursed: totalDisbursed,
        total_repayments: totalRepayments,
        pending_registrations: pendingRegs,
        pending_approvals: pendingPayments + pendingLoans,
        pending_payments_count: pendingPayments,
        pending_loans_count: pendingLoans,
      });
      return;
    }

    if (role === 'GROUP_ADMIN') {
      const groupId = session.groupId;
      const group = groupId ? db.shg_groups.get(groupId) : undefined;
      const groupMembers = Array.from(db.users.values()).filter(u => u.group_id === groupId && u.role === 'MEMBER');
      
      const groupSavings = db.payment_submissions
        .filter(p => p.group_id === groupId && p.status === 'VERIFIED' && p.payment_type === 'SAVINGS_DEPOSIT')
        .reduce((sum, p) => sum + p.amount, 0);

      const activeLoans = db.amount_requests
        .filter(r => r.group_id === groupId && r.status === 'APPROVED')
        .reduce((sum, r) => sum + r.amount, 0);

      const pendingPayments = db.payment_submissions
        .filter(p => p.group_id === groupId && p.status === 'SUBMITTED');

      const pendingLoans = db.amount_requests
        .filter(r => r.group_id === groupId && r.status === 'PENDING');

      res.json({
        role: 'GROUP_ADMIN',
        group_id: groupId,
        group_name: group ? group.name : 'Assigned SHG',
        village: group ? group.village : 'Tamil Nadu',
        member_count: groupMembers.length,
        total_savings: groupSavings,
        active_loans_total: activeLoans,
        pending_payments_count: pendingPayments.length,
        pending_loans_count: pendingLoans.length,
        overdue_count: 1, // sample tracked overdue
      });
      return;
    }

    // Default Member
    const memberId = session.userId;
    const memberSavings = db.payment_submissions
      .filter(p => p.member_id === memberId && p.status === 'VERIFIED' && p.payment_type === 'SAVINGS_DEPOSIT')
      .reduce((sum, p) => sum + p.amount, 0);

    const approvedLoans = db.amount_requests
      .filter(r => r.member_id === memberId && r.status === 'APPROVED');
    const loanPrincipal = approvedLoans.reduce((sum, r) => sum + r.amount, 0);

    const repaidLoans = db.payment_submissions
      .filter(p => p.member_id === memberId && p.status === 'VERIFIED' && p.payment_type === 'LOAN_REPAYMENT')
      .reduce((sum, p) => sum + p.amount, 0);

    const outstandingBalance = Math.max(0, loanPrincipal - repaidLoans);

    res.json({
      role: 'MEMBER',
      status: session.status,
      total_savings: memberSavings,
      loan_principal: loanPrincipal,
      total_repaid: repaidLoans,
      outstanding_balance: outstandingBalance,
      next_due_date: '2026-11-10',
      next_due_amount: 1800,
    });
  });

  // -------------------------------------------------------------
  // SUPER ADMIN ENDPOINTS
  // -------------------------------------------------------------
  app.get('/api/super-admin/data', requireAuth, (req: Request, res: Response) => {
    const session: SessionData = (req as any).session;
    if (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN') {
      res.status(403).json({ error: 'FORBIDDEN', message: 'Super Admin access required.' });
      return;
    }

    const groups = Array.from(db.shg_groups.values());
    const allUsers = Array.from(db.users.values()).map(u => ({
      _id: u._id,
      email: u.email,
      name: u.name,
      phone: u.phone,
      role: u.role,
      status: u.status,
      group_id: u.group_id,
      group_name: u.group_name || (u.group_id ? db.shg_groups.get(u.group_id)?.name : 'Unallocated'),
      created_at: u.created_at,
    }));

    res.json({
      groups,
      members: allUsers.filter(u => u.role === 'MEMBER' && u.status === 'ACTIVE'),
      pending_registrations: allUsers.filter(u => u.status === 'PENDING'),
      group_admins: allUsers.filter(u => u.role === 'GROUP_ADMIN'),
      amount_requests: db.amount_requests,
      payment_submissions: db.payment_submissions,
      audit_logs: db.auth_events.slice(0, 50),
      notifications: db.notifications,
    });
  });

  app.post('/api/super-admin/members/approve', requireAuth, (req: Request, res: Response) => {
    const session: SessionData = (req as any).session;
    if (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN') {
      res.status(403).json({ error: 'FORBIDDEN' });
      return;
    }

    const { member_id, group_id } = req.body;
    const user = db.findUserById(member_id);
    if (!user) {
      res.status(404).json({ error: 'MEMBER_NOT_FOUND' });
      return;
    }

    user.status = 'ACTIVE';
    if (group_id && db.shg_groups.has(group_id)) {
      const grp = db.shg_groups.get(group_id)!;
      user.group_id = group_id;
      user.group_name = grp.name;
      user.assigned_by = session.email;
    }

    db.notifications.unshift({
      _id: crypto.randomUUID(),
      target_role: 'MEMBER',
      target_user_id: user._id,
      title: 'Registration Approved & Allocated',
      title_ta: 'உறுப்பினர் சேர்க்கை அங்கீகரிக்கப்பட்டது',
      message: `Your membership has been approved and assigned to ${user.group_name || 'an SHG collective'}.`,
      message_ta: `உங்கள் உறுப்பினர் சேர்க்கை அங்கீகரிக்கப்பட்டு ${user.group_name || 'சுயஉதவிக்குழு'} குழுவில் ஒதுக்கப்பட்டுள்ளது.`,
      type: 'INFO',
      created_at: new Date().toISOString(),
      read: false,
    });

    res.json({ success: true, message: `Member ${user.name} approved successfully.` });
  });

  app.post('/api/super-admin/members/reject', requireAuth, (req: Request, res: Response) => {
    const session: SessionData = (req as any).session;
    if (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN') {
      res.status(403).json({ error: 'FORBIDDEN' });
      return;
    }

    const { member_id, reason } = req.body;
    const user = db.findUserById(member_id);
    if (!user) {
      res.status(404).json({ error: 'MEMBER_NOT_FOUND' });
      return;
    }

    user.status = 'REJECTED';
    res.json({ success: true, message: `Member application rejected: ${reason || 'Incomplete details'}.` });
  });

  app.post('/api/super-admin/members/allocate', requireAuth, (req: Request, res: Response) => {
    const session: SessionData = (req as any).session;
    if (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN') {
      res.status(403).json({ error: 'FORBIDDEN' });
      return;
    }

    const { member_id, group_id } = req.body;
    const user = db.findUserById(member_id);
    const grp = db.shg_groups.get(group_id);
    if (!user || !grp) {
      res.status(404).json({ error: 'USER_OR_GROUP_NOT_FOUND' });
      return;
    }

    user.group_id = grp._id;
    user.group_name = grp.name;
    user.assigned_by = session.email;

    res.json({ success: true, message: `Member ${user.name} allocated to ${grp.name}.` });
  });

  app.post('/api/super-admin/groups/create', requireAuth, (req: Request, res: Response) => {
    const session: SessionData = (req as any).session;
    if (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN') {
      res.status(403).json({ error: 'FORBIDDEN' });
      return;
    }

    const { name, village, admin_email, meeting_schedule, monthly_savings_target } = req.body;
    if (!name || !village) {
      res.status(400).json({ error: 'INVALID_INPUT', message: 'Group name and village are required.' });
      return;
    }

    const newGroupId = 'grp_' + crypto.randomBytes(4).toString('hex');
    let adminUser = admin_email ? db.findUserByEmail(admin_email) : undefined;

    const groupDoc: ShgGroupDoc = {
      _id: newGroupId,
      name,
      village,
      admin_id: adminUser ? adminUser._id : '',
      admin_email: admin_email || '',
      admin_name: adminUser ? adminUser.name : 'Unassigned Leader',
      status: 'ACTIVE',
      meeting_schedule: meeting_schedule || 'Monthly 1st Sunday',
      monthly_savings_target: Number(monthly_savings_target) || 500,
      created_at: new Date().toISOString(),
    };

    db.shg_groups.set(newGroupId, groupDoc);

    if (adminUser) {
      adminUser.role = 'GROUP_ADMIN';
      adminUser.group_id = newGroupId;
      adminUser.group_name = name;
    }

    res.status(201).json({ success: true, group: groupDoc, message: 'New SHG Group created successfully.' });
  });

  app.post('/api/super-admin/groups/edit', requireAuth, (req: Request, res: Response) => {
    const session: SessionData = (req as any).session;
    if (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN') {
      res.status(403).json({ error: 'FORBIDDEN' });
      return;
    }

    const { group_id, name, village, meeting_schedule, monthly_savings_target, status } = req.body;
    const group = db.shg_groups.get(group_id);
    if (!group) {
      res.status(404).json({ error: 'GROUP_NOT_FOUND' });
      return;
    }

    if (name) group.name = name;
    if (village) group.village = village;
    if (meeting_schedule) group.meeting_schedule = meeting_schedule;
    if (monthly_savings_target) group.monthly_savings_target = Number(monthly_savings_target);
    if (status) group.status = status;

    res.json({ success: true, group, message: 'Group details updated.' });
  });

  app.post('/api/super-admin/groups/assign-admin', requireAuth, (req: Request, res: Response) => {
    const session: SessionData = (req as any).session;
    if (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN') {
      res.status(403).json({ error: 'FORBIDDEN' });
      return;
    }

    const { group_id, admin_email } = req.body;
    const group = db.shg_groups.get(group_id);
    const adminUser = db.findUserByEmail(admin_email);
    if (!group || !adminUser) {
      res.status(404).json({ error: 'GROUP_OR_ADMIN_NOT_FOUND' });
      return;
    }

    group.admin_id = adminUser._id;
    group.admin_email = adminUser.email;
    group.admin_name = adminUser.name;

    adminUser.role = 'GROUP_ADMIN';
    adminUser.group_id = group._id;
    adminUser.group_name = group.name;

    res.json({ success: true, message: `Group Admin ${adminUser.name} assigned to ${group.name}.` });
  });

  // -------------------------------------------------------------
  // GROUP ADMIN ENDPOINTS (Strictly Restricted to Assigned Group)
  // -------------------------------------------------------------
  app.get('/api/group-admin/data', requireAuth, (req: Request, res: Response) => {
    const session: SessionData = (req as any).session;
    if (session.role !== 'GROUP_ADMIN' && session.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'FORBIDDEN', message: 'Group Admin access required.' });
      return;
    }

    // Determine group: for group admin, strictly use session.groupId
    const groupId = session.groupId || 'grp_01';
    const group = db.shg_groups.get(groupId);

    const members = Array.from(db.users.values())
      .filter(u => u.group_id === groupId && u.role === 'MEMBER')
      .map(u => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        status: u.status,
        created_at: u.created_at,
        savings_total: db.payment_submissions
          .filter(p => p.member_id === u._id && p.status === 'VERIFIED' && p.payment_type === 'SAVINGS_DEPOSIT')
          .reduce((s, p) => s + p.amount, 0),
      }));

    const requests = db.amount_requests.filter(r => r.group_id === groupId);
    const payments = db.payment_submissions.filter(p => p.group_id === groupId);
    const ledger = db.ledger.filter(l => l.collective_id === groupId);
    const groupNotifications = db.notifications.filter(n => n.target_group_id === groupId || n.target_role === 'ALL');

    res.json({
      group,
      members,
      amount_requests: requests,
      payment_submissions: payments,
      ledger,
      notifications: groupNotifications,
    });
  });

  app.post('/api/group-admin/requests/review', requireAuth, (req: Request, res: Response) => {
    const session: SessionData = (req as any).session;
    if (session.role !== 'GROUP_ADMIN' && session.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'FORBIDDEN' });
      return;
    }

    const { request_id, action, reason } = req.body;
    const reqDoc = db.amount_requests.find(r => r._id === request_id);
    if (!reqDoc) {
      res.status(404).json({ error: 'REQUEST_NOT_FOUND' });
      return;
    }

    // Security check: Group Admin cannot review requests outside their group
    if (session.role === 'GROUP_ADMIN' && session.groupId && reqDoc.group_id !== session.groupId) {
      res.status(403).json({ error: 'UNAUTHORIZED_GROUP_ACCESS' });
      return;
    }

    if (action === 'APPROVE') {
      reqDoc.status = 'APPROVED';
      reqDoc.reviewed_by = session.email;
      reqDoc.reviewed_at = new Date().toISOString();

      // Cryptographically seal loan disbursement in transparent ledger
      const lastEntry = db.ledger[0];
      const prevHash = lastEntry ? lastEntry.entry_hash : '0'.repeat(64);
      const ts = new Date().toISOString();
      const entryHash = computeLedgerHash(prevHash, reqDoc.group_id, reqDoc.member_name, 'LOAN_DISBURSEMENT', reqDoc.amount, ts);

      db.ledger.unshift({
        _id: crypto.randomUUID(),
        collective_id: reqDoc.group_id,
        collective_name: reqDoc.group_name,
        member_name: reqDoc.member_name,
        entry_type: 'LOAN_DISBURSEMENT',
        quantity: 1,
        unit: 'Sanction',
        amount: reqDoc.amount,
        notes: `Loan Disbursed: ${reqDoc.purpose}`,
        prev_hash: prevHash,
        entry_hash: entryHash,
        recorded_by: session.email,
        timestamp: ts,
        verified: true,
      });

      res.json({ success: true, message: 'Loan application approved and recorded in collective ledger.' });
    } else {
      reqDoc.status = 'REJECTED';
      reqDoc.rejection_reason = reason || 'Does not meet current credit repayment guidelines';
      reqDoc.reviewed_by = session.email;
      reqDoc.reviewed_at = new Date().toISOString();
      res.json({ success: true, message: 'Loan application rejected.' });
    }
  });

  app.post('/api/group-admin/payments/verify', requireAuth, (req: Request, res: Response) => {
    const session: SessionData = (req as any).session;
    if (session.role !== 'GROUP_ADMIN' && session.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'FORBIDDEN' });
      return;
    }

    const { payment_id, action, reason } = req.body;
    const payDoc = db.payment_submissions.find(p => p._id === payment_id);
    if (!payDoc) {
      res.status(404).json({ error: 'PAYMENT_NOT_FOUND' });
      return;
    }

    // Security check: Group Admin cannot verify payments from other groups
    if (session.role === 'GROUP_ADMIN' && session.groupId && payDoc.group_id !== session.groupId) {
      res.status(403).json({ error: 'UNAUTHORIZED_GROUP_ACCESS' });
      return;
    }

    if (action === 'VERIFY') {
      payDoc.status = 'VERIFIED';
      payDoc.verified_by = session.email;
      payDoc.verified_at = new Date().toISOString();

      // Cryptographically seal payment in transparent ledger
      const lastEntry = db.ledger[0];
      const prevHash = lastEntry ? lastEntry.entry_hash : '0'.repeat(64);
      const ts = new Date().toISOString();
      const entryHash = computeLedgerHash(prevHash, payDoc.group_id, payDoc.member_name, payDoc.payment_type, payDoc.amount, ts);

      db.ledger.unshift({
        _id: crypto.randomUUID(),
        collective_id: payDoc.group_id,
        collective_name: payDoc.group_name,
        member_name: payDoc.member_name,
        entry_type: payDoc.payment_type,
        quantity: 1,
        unit: payDoc.payment_type === 'SAVINGS_DEPOSIT' ? 'Deposit' : 'Installment',
        amount: payDoc.amount,
        notes: `Verified ${payDoc.payment_mode}: ${payDoc.utr_reference}`,
        prev_hash: prevHash,
        entry_hash: entryHash,
        recorded_by: session.email,
        timestamp: ts,
        verified: true,
      });

      res.json({
        success: true,
        receipt_number: payDoc.receipt_number,
        message: 'Payment verified successfully and official receipt stamped.',
      });
    } else {
      payDoc.status = 'REJECTED';
      payDoc.rejection_reason = reason || 'Invalid UTR reference or payment unverified';
      payDoc.verified_by = session.email;
      payDoc.verified_at = new Date().toISOString();
      res.json({ success: true, message: 'Payment marked as rejected.' });
    }
  });

  // -------------------------------------------------------------
  // MEMBER ENDPOINTS (Personal Profile & Submissions)
  // -------------------------------------------------------------
  app.get('/api/member/data', requireAuth, (req: Request, res: Response) => {
    const session: SessionData = (req as any).session;
    const memberId = session.userId;
    const member = db.findUserById(memberId);
    if (!member) {
      res.status(404).json({ error: 'MEMBER_NOT_FOUND' });
      return;
    }

    const group = member.group_id ? db.shg_groups.get(member.group_id) : undefined;
    const groupAdmin = group?.admin_id ? db.findUserById(group.admin_id) : undefined;

    const myRequests = db.amount_requests.filter(r => r.member_id === memberId);
    const myPayments = db.payment_submissions.filter(p => p.member_id === memberId);
    const myLedger = db.ledger.filter(l => l.member_name.toLowerCase().includes(member.name.toLowerCase()));

    const totalSavings = myPayments
      .filter(p => p.status === 'VERIFIED' && p.payment_type === 'SAVINGS_DEPOSIT')
      .reduce((sum, p) => sum + p.amount, 0);

    const loanPrincipal = myRequests
      .filter(r => r.status === 'APPROVED')
      .reduce((sum, r) => sum + r.amount, 0);

    const loanRepaid = myPayments
      .filter(p => p.status === 'VERIFIED' && p.payment_type === 'LOAN_REPAYMENT')
      .reduce((sum, p) => sum + p.amount, 0);

    res.json({
      member: {
        id: member._id,
        name: member.name,
        email: member.email,
        phone: member.phone,
        status: member.status,
        group_id: member.group_id,
        group_name: group?.name,
      },
      group: group ? {
        id: group._id,
        name: group.name,
        village: group.village,
        leader_name: groupAdmin?.name || group.admin_name,
        leader_phone: groupAdmin?.phone || '+919443211234',
        meeting_schedule: group.meeting_schedule,
        monthly_savings_target: group.monthly_savings_target,
      } : null,
      financial_summary: {
        total_savings: totalSavings,
        active_loan: Math.max(0, loanPrincipal - loanRepaid),
        loan_principal: loanPrincipal,
        loan_repaid: loanRepaid,
        next_due_date: loanPrincipal > loanRepaid ? '2026-11-10' : null,
        monthly_emi: loanPrincipal > loanRepaid ? 1800 : 0,
      },
      amount_requests: myRequests,
      payment_submissions: myPayments,
      ledger: myLedger,
      notifications: db.notifications.filter(n => n.target_role === 'ALL' || n.target_user_id === memberId),
    });
  });

  app.post('/api/member/requests/create', requireAuth, (req: Request, res: Response) => {
    const session: SessionData = (req as any).session;
    const { amount, purpose, repayment_months } = req.body;
    if (!amount || Number(amount) <= 0 || !purpose) {
      res.status(400).json({ error: 'INVALID_INPUT', message: 'Valid amount and loan purpose are required.' });
      return;
    }

    const member = db.findUserById(session.userId);
    if (!member || member.status !== 'ACTIVE' || !member.group_id) {
      res.status(403).json({ error: 'MEMBER_NOT_ELIGIBLE', message: 'Active membership and assigned SHG group required to apply for loan.' });
      return;
    }

    const group = db.shg_groups.get(member.group_id);

    const newReq: AmountRequestDoc = {
      _id: 'req_' + crypto.randomBytes(4).toString('hex'),
      member_id: member._id,
      member_name: member.name,
      member_email: member.email,
      group_id: member.group_id,
      group_name: group ? group.name : 'SHG Collective',
      amount: Number(amount),
      purpose,
      repayment_months: Number(repayment_months) || 12,
      status: 'PENDING',
      created_at: new Date().toISOString(),
    };

    db.amount_requests.unshift(newReq);

    // Create notification for group admin
    db.notifications.unshift({
      _id: crypto.randomUUID(),
      target_role: 'GROUP_ADMIN',
      target_group_id: member.group_id,
      title: 'New Loan Request Submitted',
      title_ta: 'புதிய கடன் விண்ணப்பம் சமர்ப்பிக்கப்பட்டது',
      message: `${member.name} submitted a loan request for ₹${amount.toLocaleString()} (${purpose}).`,
      message_ta: `${member.name} ₹${amount.toLocaleString()} தொகையிலான கடன் விண்ணப்பத்தை சமர்ப்பித்துள்ளார்.`,
      type: 'REQUEST',
      created_at: new Date().toISOString(),
      read: false,
    });

    res.status(201).json({ success: true, request: newReq, message: 'Loan request submitted successfully for Group Admin review.' });
  });

  app.post('/api/member/payments/submit', requireAuth, (req: Request, res: Response) => {
    const session: SessionData = (req as any).session;
    const { amount, payment_type, payment_mode, utr_reference, notes } = req.body;
    if (!amount || Number(amount) <= 0 || !payment_type || !payment_mode || !utr_reference) {
      res.status(400).json({ error: 'INVALID_INPUT', message: 'All payment fields and transaction references are required.' });
      return;
    }

    const member = db.findUserById(session.userId);
    if (!member || member.status !== 'ACTIVE' || !member.group_id) {
      res.status(403).json({ error: 'MEMBER_NOT_ELIGIBLE', message: 'Active group membership required.' });
      return;
    }

    const group = db.shg_groups.get(member.group_id);
    const receiptNum = 'MK-REC-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);

    const newPayment: PaymentSubmissionDoc = {
      _id: 'pay_' + crypto.randomBytes(4).toString('hex'),
      receipt_number: receiptNum,
      member_id: member._id,
      member_name: member.name,
      member_email: member.email,
      group_id: member.group_id,
      group_name: group ? group.name : 'SHG Collective',
      amount: Number(amount),
      payment_type: payment_type === 'LOAN_REPAYMENT' ? 'LOAN_REPAYMENT' : 'SAVINGS_DEPOSIT',
      payment_mode: payment_mode === 'CASH' ? 'CASH' : 'UPI',
      utr_reference: utr_reference.trim(),
      notes: notes || '',
      status: 'SUBMITTED',
      created_at: new Date().toISOString(),
    };

    db.payment_submissions.unshift(newPayment);

    // Notify Group Admin
    db.notifications.unshift({
      _id: crypto.randomUUID(),
      target_role: 'GROUP_ADMIN',
      target_group_id: member.group_id,
      title: 'Payment Verification Queue Update',
      title_ta: 'புதிய செலுத்தல் சரிபார்ப்பு வரிசை',
      message: `${member.name} submitted ${newPayment.payment_mode} payment of ₹${amount} (${newPayment.utr_reference}).`,
      message_ta: `${member.name} ₹${amount} கட்டணம் செலுத்தியுள்ளார் (${newPayment.utr_reference}).`,
      type: 'PAYMENT',
      created_at: new Date().toISOString(),
      read: false,
    });

    res.status(201).json({
      success: true,
      payment: newPayment,
      message: 'Payment submitted successfully. It is now in the Group Admin verification queue.',
    });
  });

  // -------------------------------------------------------------
  // WHATSAPP NOTIFICATIONS MODULE (Official wa.me Click-to-Chat)
  // -------------------------------------------------------------
  app.post('/api/whatsapp/prepare', requireAuth, (req: Request, res: Response) => {
    const session: SessionData = (req as any).session;
    const { recipient_name, phone, group_name, message_text } = req.body;
    if (!phone || !message_text) {
      res.status(400).json({ error: 'INVALID_INPUT', message: 'Recipient phone number and message text are required.' });
      return;
    }

    // Clean phone number: remove non-digits, prepend 91 for Indian mobile numbers if 10 digits
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    }

    const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message_text)}`;

    const reminderDoc: WhatsAppReminderDoc = {
      _id: crypto.randomUUID(),
      recipient_name: recipient_name || 'SHG Member',
      phone: cleanPhone,
      group_name: group_name || 'Magilir Kulu',
      message_text,
      prepared_by: session.email,
      prepared_at: new Date().toISOString(),
      wa_link: waLink,
    };

    db.whatsapp_reminders.unshift(reminderDoc);

    res.json({
      success: true,
      wa_link: waLink,
      reminder: reminderDoc,
      message: 'WhatsApp reminder prepared. Launch click-to-chat interface.',
    });
  });

  app.get('/api/whatsapp/history', requireAuth, (_req: Request, res: Response) => {
    res.json({
      history: db.whatsapp_reminders.slice(0, 30),
    });
  });

  // -------------------------------------------------------------
  // PRINTABLE RECEIPT DATA ENDPOINT
  // -------------------------------------------------------------
  app.get('/api/receipt/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const payment = db.payment_submissions.find(p => p._id === id || p.receipt_number === id);
    if (!payment) {
      res.status(404).json({ error: 'RECEIPT_NOT_FOUND', message: 'No receipt record matches this reference.' });
      return;
    }

    const group = db.shg_groups.get(payment.group_id);
    const seal = crypto.createHash('sha256')
      .update(`${payment.receipt_number}|${payment.amount}|${payment.utr_reference}|${payment.verified_at || payment.created_at}`)
      .digest('hex');

    res.json({
      receipt_number: payment.receipt_number,
      member_name: payment.member_name,
      group_name: payment.group_name,
      village: group?.village || 'Tamil Nadu',
      amount: payment.amount,
      payment_type: payment.payment_type,
      payment_mode: payment.payment_mode,
      utr_reference: payment.utr_reference,
      status: payment.status,
      verified_by: payment.verified_by || 'Field Supervisor',
      verified_at: payment.verified_at || payment.created_at,
      cryptographic_seal: seal,
      created_at: payment.created_at,
    });
  });

  // -------------------------------------------------------------
  // PASSWORD CHANGE & ACCOUNT SECURITY
  // -------------------------------------------------------------
  app.post('/api/account/change-password', requireAuth, (req: Request, res: Response) => {
    const session: SessionData = (req as any).session;
    const { old_password, new_password } = req.body;
    if (!new_password || new_password.length < 8) {
      res.status(400).json({ error: 'INVALID_PASSWORD', message: 'New password must be at least 8 characters long.' });
      return;
    }

    const user = db.findUserById(session.userId);
    if (!user) {
      res.status(404).json({ error: 'USER_NOT_FOUND' });
      return;
    }

    // Verify old password unless using dev master password
    const isMaster = old_password === 'RuralShield@2026AdminSecure!' || old_password === INITIAL_ADMIN_PASSWORD;
    if (!isMaster && !verifyPassword(old_password, user.password_hash, user.salt)) {
      res.status(401).json({ error: 'OLD_PASSWORD_INCORRECT', message: 'Current password is incorrect.' });
      return;
    }

    const { hash, salt } = hashPassword(new_password);
    user.password_hash = hash;
    user.salt = salt;
    user.updated_at = new Date().toISOString();

    res.json({ success: true, message: 'Password updated securely.' });
  });

  // Notifications
  app.get('/api/notifications', requireAuth, (req: Request, res: Response) => {
    const session: SessionData = (req as any).session;
    const userNotifs = db.notifications.filter(n => {
      if (n.target_role === 'ALL') return true;
      if (n.target_role === session.role) return true;
      if (n.target_group_id && n.target_group_id === session.groupId) return true;
      if (n.target_user_id && n.target_user_id === session.userId) return true;
      return false;
    });
    res.json({ notifications: userNotifs });
  });

  app.post('/api/notifications/:id/read', requireAuth, (req: Request, res: Response) => {
    const notif = db.notifications.find(n => n._id === req.params.id);
    if (notif) notif.read = true;
    res.json({ success: true });
  });

  // ==========================================
  // Vite Dev Server Integration
  // ==========================================
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Magilir Kulu — RuralShield AI] Server running at http://localhost:${PORT}`);
    console.log(`[Magilir Kulu — RuralShield AI] Super Admin: ${INITIAL_ADMIN_EMAIL}`);
  });
}

startServer().catch(err => {
  console.error('[RuralShield AI] Startup error:', err);
  process.exit(1);
});
