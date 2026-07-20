import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getApiSession } from "@/lib/api-auth";
import { S3 } from "@/lib/s3-client";

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

// Fotos de PDV vêm do celular do promotor; PDFs são os books/catálogos gerados.
// Qualquer outro tipo não tem caminho legítimo até este bucket.
const ALLOWED_CONTENT_TYPES = /^(image\/|application\/pdf$)/;

const fileUploadSchema = z.object({
  fileName: z.string().min(1, "Nome do arquivo é obrigatório"),
  contentType: z
    .string()
    .min(1, "Content type is required")
    .refine((value) => ALLOWED_CONTENT_TYPES.test(value), {
      message: "Tipo de arquivo não permitido",
    }),
  size: z
    .number()
    .int()
    .min(1, "Size is required")
    .max(MAX_UPLOAD_BYTES, "Arquivo excede o limite de 15MB"),
  isImage: z.boolean(),
});

export async function POST(request: Request) {
  try {
    const session = await getApiSession(request);
    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();

    const validation = fileUploadSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid Request Body",
        },
        {
          status: 400,
        }
      );
    }

    const { fileName, contentType, size } = validation.data;

    const uniqueKey = `${uuidv4()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
      ContentType: contentType,
      ContentLength: size,
      Key: uniqueKey,
    });

    const presignedUrl = await getSignedUrl(S3, command, {
      expiresIn: 360, // 6 minutes
    });

    const response = {
      presignedUrl,
      key: uniqueKey,
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      {
        error: "Failed to generate presigned URL",
      },
      {
        status: 500,
      }
    );
  }
}
