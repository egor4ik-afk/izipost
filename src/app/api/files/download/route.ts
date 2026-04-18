// В iziposta: src/app/api/files/download/route.ts
// Генерирует presigned GET URL с Content-Disposition: attachment

import { NextRequest, NextResponse } from "next/server";
import { s3, bucketName } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  const name = searchParams.get("name") || "file";

  if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400, headers });

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(name)}"`,
    });
    const url = await getSignedUrl(s3, command, { expiresIn: 300 });
    return NextResponse.json({ url }, { headers });
  } catch (e) {
    console.error("[Download]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500, headers });
  }
}
