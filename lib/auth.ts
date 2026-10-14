import { getServerSession } from "next-auth/next";
import type { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { NextResponse } from "next/server";

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
};

export async function getAdminSession(req?: Request): Promise<{ isAdmin: boolean; email?: string }> {
  try {
    // Optional secret key check via header (e.g. for maintenance or automated cron)
    if (req && process.env.ADMIN_SECRET) {
      const secretHeader = req.headers.get('x-admin-key') || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
      if (secretHeader && secretHeader === process.env.ADMIN_SECRET) {
        return { isAdmin: true, email: 'system@admin' };
      }
    }

    const session = await getServerSession(authOptions);
    const email = session?.user?.email?.trim().toLowerCase();
    if (!email) {
      return { isAdmin: false };
    }

    const adminEmailsRaw = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';
    const adminEmails = adminEmailsRaw
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);

    const isAdmin = adminEmails.includes(email);
    return { isAdmin, email };
  } catch (error) {
    console.error('getAdminSession error:', error);
    return { isAdmin: false };
  }
}

/**
 * Returns a 401/403 NextResponse if the user is not an authenticated admin,
 * or null if the user is an authorized admin.
 */
export async function assertAdmin(req?: Request): Promise<NextResponse | null> {
  const { isAdmin } = await getAdminSession(req);
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Non autorizzato: operazione riservata agli amministratori.' },
      { status: 403 }
    );
  }
  return null;
}
