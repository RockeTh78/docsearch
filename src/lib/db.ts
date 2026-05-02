import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "dev.db");

const globalDb = globalThis as unknown as { db: Database.Database };
export const db = globalDb.db ?? new Database(DB_PATH);
if (process.env.NODE_ENV !== "production") globalDb.db = db;

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    birthDate TEXT NOT NULL,
    insuranceType TEXT NOT NULL DEFAULT 'gesetzlich',
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS requests (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    doctorId TEXT NOT NULL,
    doctorName TEXT NOT NULL,
    specialty TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    zip TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    website TEXT,
    distance REAL,
    problem TEXT NOT NULL,
    method TEXT NOT NULL DEFAULT 'email',
    status TEXT NOT NULL DEFAULT 'pending',
    statusMsg TEXT,
    sentAt TEXT,
    respondedAt TEXT,
    suggestedAt TEXT,
    notes TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id)
  );
`);

try { db.exec("ALTER TABLE requests ADD COLUMN suggestedAt TEXT"); } catch {}
try { db.exec("ALTER TABLE requests ADD COLUMN appointmentAt TEXT"); } catch {}
try { db.exec("ALTER TABLE requests ADD COLUMN doctorMessage TEXT"); } catch {}

db.exec(`
  CREATE TABLE IF NOT EXISTS inbox_emails (
    id TEXT PRIMARY KEY,
    from_addr TEXT NOT NULL,
    from_name TEXT,
    to_addr TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    reply_to TEXT,
    received_at TEXT NOT NULL DEFAULT (datetime('now')),
    read INTEGER NOT NULL DEFAULT 0,
    replied INTEGER NOT NULL DEFAULT 0
  );
`);

function cuid(): string {
  return "c" + Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

export function upsertUser(data: {
  firstName: string; lastName: string; email: string;
  phone: string; birthDate: string; insuranceType: string;
}) {
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(data.email) as { id: string } | undefined;
  if (existing) {
    db.prepare(`UPDATE users SET firstName=?,lastName=?,phone=?,birthDate=?,insuranceType=? WHERE id=?`)
      .run(data.firstName, data.lastName, data.phone, data.birthDate, data.insuranceType, existing.id);
    return existing.id;
  }
  const id = cuid();
  db.prepare(`INSERT INTO users (id,firstName,lastName,email,phone,birthDate,insuranceType) VALUES (?,?,?,?,?,?,?)`)
    .run(id, data.firstName, data.lastName, data.email, data.phone, data.birthDate, data.insuranceType);
  return id;
}

export function createRequest(data: {
  userId: string; doctorId: string; doctorName: string; specialty: string;
  address: string; city: string; zip: string; phone?: string; email?: string;
  website?: string; distance?: number; problem: string; method?: string;
}) {
  const id = cuid();
  db.prepare(`
    INSERT INTO requests (id,userId,doctorId,doctorName,specialty,address,city,zip,phone,email,website,distance,problem,method,status)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(id, data.userId, data.doctorId, data.doctorName, data.specialty,
         data.address, data.city, data.zip, data.phone ?? null, data.email ?? null,
         data.website ?? null, data.distance ?? null, data.problem, data.method ?? "email", "pending");
  return id;
}

export function updateRequestStatus(id: string, status: string, statusMsg?: string, sentAt?: string) {
  db.prepare(`UPDATE requests SET status=?,statusMsg=?,sentAt=?,updatedAt=datetime('now') WHERE id=?`)
    .run(status, statusMsg ?? null, sentAt ?? null, id);
}

export function setRequestResponded(id: string, suggestedAt: string, doctorMessage?: string) {
  db.prepare(`UPDATE requests SET status='responded',suggestedAt=?,doctorMessage=?,respondedAt=datetime('now'),updatedAt=datetime('now') WHERE id=?`)
    .run(suggestedAt, doctorMessage ?? null, id);
}

export function storeInboxEmail(data: {
  from_addr: string; from_name?: string; to_addr: string;
  subject: string; body: string; reply_to?: string;
}) {
  const id = "c" + Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
  db.prepare(`
    INSERT INTO inbox_emails (id, from_addr, from_name, to_addr, subject, body, reply_to)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.from_addr, data.from_name ?? null, data.to_addr,
         data.subject, data.body, data.reply_to ?? null);
  return id;
}

export function getInboxEmails() {
  return db.prepare(
    "SELECT * FROM inbox_emails ORDER BY received_at DESC"
  ).all();
}

export function markEmailRead(id: string) {
  db.prepare("UPDATE inbox_emails SET read=1 WHERE id=?").run(id);
}

export function markEmailReplied(id: string) {
  db.prepare("UPDATE inbox_emails SET replied=1 WHERE id=?").run(id);
}

export function getRequestWithUser(requestId: string) {
  return db.prepare(`
    SELECT r.*, u.firstName, u.lastName, u.email as userEmail, u.phone, u.birthDate, u.insuranceType
    FROM requests r JOIN users u ON r.userId = u.id
    WHERE r.id = ?
  `).get(requestId) as Record<string, unknown> | undefined ?? null;
}

export function confirmRequest(id: string, appointmentAt: string) {
  db.prepare(`UPDATE requests SET appointmentAt=?, updatedAt=datetime('now') WHERE id=?`)
    .run(appointmentAt, id);
}

export function getRequestsByEmail(email: string) {
  const user = db.prepare("SELECT id FROM users WHERE email=?").get(email) as { id: string } | undefined;
  if (!user) return [];
  return db.prepare("SELECT * FROM requests WHERE userId=? ORDER BY createdAt DESC").all(user.id);
}
