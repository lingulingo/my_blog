import { getServerAuthSession } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function requireSession() {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }

  return session;
}

export async function canManagePost(userId: string, postId: string, role: "USER" | "ADMIN") {
  if (role === "ADMIN") {
    return true;
  }

  const post = await prisma.post.findFirst({ where: { id: postId, authorId: userId }, select: { id: true } });
  return Boolean(post);
}
