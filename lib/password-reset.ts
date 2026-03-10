import crypto from "crypto";

const RESET_TOKEN_TTL_MINUTES = 30;

export function createPasswordResetToken() {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashPasswordResetToken(token);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);

  return {
    token,
    tokenHash,
    expiresAt,
  };
}

export function hashPasswordResetToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function getPasswordResetUrl(token: string) {
  const baseUrl = process.env.SITE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const url = new URL("/auth/reset-password", baseUrl);
  url.searchParams.set("token", token);
  return url.toString();
}
