import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";



const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

export async function POST(request: Request) {
  try {
    const { filename, contentType } = await request.json();

    if (!filename || !contentType) {
      return NextResponse.json(
        { message: "filename and contentType are required" },
        { status: 400 }
      );
    }

    const uniqueKey = `notes/${Date.now()}-${filename}`;
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: uniqueKey,
      ContentType: contentType,
    });

    // Generate pre-signed URL valid for 15 minutes (900 seconds)
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
    
    // Construct the permanent S3 object URL (private; access via pre-signed GET)
    const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueKey}`;

    return NextResponse.json({
      uploadUrl,
      fileUrl,
    });
  } catch (error: any) {
    console.error("S3 Presigned URL Generation Error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to generate pre-signed URL" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        { message: "key parameter is required" },
        { status: 400 }
      );
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    // Generate pre-signed GET URL valid for 1 hour (3600 seconds)
    const viewUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return NextResponse.json({ viewUrl });
  } catch (error: any) {
    console.error("S3 Presigned GET URL Error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to generate pre-signed URL for viewing" },
      { status: 500 }
    );
  }
}
