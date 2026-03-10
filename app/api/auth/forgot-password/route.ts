import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/mail";
import { createPasswordResetToken, getPasswordResetUrl } from "@/lib/password-reset";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = forgotPasswordSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "参数不合法" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, email: true },
  });

  if (!user) {
    return NextResponse.json({ ok: true });
  }

  const { token, tokenHash, expiresAt } = createPasswordResetToken();

  await prisma.passwordResetToken.deleteMany({
    where: {
      OR: [
        { userId: user.id },
        { expiresAt: { lt: new Date() } },
      ],
    },
  });

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  try {
    await sendPasswordResetEmail({
      to: user.email,
      resetUrl: getPasswordResetUrl(token),
    });
  } catch (error) {
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    console.error("发送重置密码邮件失败", error);
    return NextResponse.json({ error: "邮件发送失败，请稍后重试" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
