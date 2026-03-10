import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { hashPasswordResetToken } from "@/lib/password-reset";

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6).max(100),
});

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = resetPasswordSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "参数不合法" }, { status: 400 });
  }

  const tokenHash = hashPasswordResetToken(parsed.data.token);
  const now = new Date();

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: {
      userId: true,
      expiresAt: true,
    },
  });

  if (!resetToken || resetToken.expiresAt <= now) {
    if (resetToken) {
      await prisma.passwordResetToken.deleteMany({
        where: { userId: resetToken.userId },
      });
    }

    return NextResponse.json({ error: "重置链接无效或已过期" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.deleteMany({
      where: { userId: resetToken.userId },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
