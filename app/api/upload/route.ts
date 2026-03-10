import { NextResponse } from "next/server";

import { getServerAuthSession } from "@/auth";
import { saveUpload } from "@/lib/uploads";

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const kind = formData.get("kind");

  if (!(file instanceof File) || (kind !== "avatars" && kind !== "posts")) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const url = await saveUpload(file, kind);
  return NextResponse.json({ url });
}
