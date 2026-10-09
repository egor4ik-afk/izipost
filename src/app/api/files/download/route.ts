// src/app/api/files/download/route.ts
// Presigned GET с Content-Disposition: attachment — только после входа и только для своих
// файлов (lib/storage-access). Раньше отдавал ссылку на любой ключ бакета кому угодно.

import { NextRequest, NextResponse } from "next/server";
import { s3, bucketName } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { canAccess, storageUser } from "@/lib/storage-access";

export async function GET(req: NextRequest) {
  const u = await storageUser();
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  const name = searchParams.get("name") || "file";

  if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });
  if (!canAccess(u, key)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(name)}"`,
    });
    const url = await getSignedUrl(s3, command, { expiresIn: 300 });
    return NextResponse.json({ url });
  } catch (e) {
    console.error("[Download]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
