import { cookies } from "next/headers";
import { getIronSession, type IronSession } from "iron-session";

/** Encrypted, httpOnly cookie session — no server-side session table needed. */
export type SessionData = {
  /** Set once a branch user (Owner/Manager/Staff) logs in. */
  userId?: string;
  /** Set once a Platform Admin logs in. Mutually exclusive with userId in practice. */
  platformAdminId?: string;
  /** The branch the signed-in user is currently viewing (for branch switching). */
  activeBranchId?: string;
};

const sessionPassword = process.env.SESSION_SECRET;
if (!sessionPassword || sessionPassword.length < 32) {
  throw new Error("SESSION_SECRET must be set and at least 32 characters long.");
}

export const sessionOptions = {
  password: sessionPassword,
  cookieName: "tenderista_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

/** Usable in Server Components (read-only) and Route Handlers/Server Actions (read/write). */
export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}
