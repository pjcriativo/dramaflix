import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";
import { checkAdmin } from "@/lib/adminAuth";

function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export async function POST(request: Request) {
  const auth = await checkAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const tipo = (formData.get("tipo") as string) || "capa"; // "capa" ou "banner"

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tamanhoOriginalBytes = buffer.length;

    // Define diretório de destino: web/public/uploads/capas ou web/public/uploads/banners
    const pastaSub = tipo === "banner" ? "banners" : "capas";
    const dirDestino = path.join(process.cwd(), "public", "uploads", pastaSub);

    if (!fs.existsSync(dirDestino)) {
      fs.mkdirSync(dirDestino, { recursive: true });
    }

    // Nome único para o arquivo
    const hash = crypto.randomBytes(6).toString("hex");
    const nomeBase = file.name
      .replace(/\.[^/.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .slice(0, 30);
    const nomeArquivo = `${Date.now()}-${nomeBase}-${hash}.webp`;
    const caminhoCompleto = path.join(dirDestino, nomeArquivo);

    // Processamento inteligente com sharp de acordo com as especificações da Netflix:
    // Capa: proporção 3:4 (900x1200 para máxima nitidez em telas retina)
    // Banner: proporção 16:9 (1920x1080 Full HD)
    let pipeline = sharp(buffer).rotate(); // auto-orientação baseada no EXIF

    let larguraMeta = 900;
    let alturaMeta = 1200;

    if (tipo === "banner") {
      larguraMeta = 1920;
      alturaMeta = 1080;
    }

    pipeline = pipeline
      .resize(larguraMeta, alturaMeta, {
        fit: "cover",
        position: "center",
      })
      .webp({
        quality: 85,
        effort: 4,
      });

    const bufferOtimizado = await pipeline.toBuffer();
    await fs.promises.writeFile(caminhoCompleto, bufferOtimizado);

    const tamanhoOtimizadoBytes = bufferOtimizado.length;
    const reducaoPercentual = Math.round(
      ((tamanhoOriginalBytes - tamanhoOtimizadoBytes) / tamanhoOriginalBytes) * 100
    );

    const urlPublica = `/uploads/${pastaSub}/${nomeArquivo}`;

    return NextResponse.json({
      ok: true,
      url: urlPublica,
      tamanhoOriginal: formatBytes(tamanhoOriginalBytes),
      tamanhoOtimizado: formatBytes(tamanhoOtimizadoBytes),
      reducao: `${reducaoPercentual > 0 ? "-" : "+"}${Math.abs(reducaoPercentual)}%`,
      largura: larguraMeta,
      altura: alturaMeta,
      formato: "WebP",
    });
  } catch (error) {
    console.error("Erro no upload e processamento de imagem:", error);
    return NextResponse.json(
      { error: "Erro ao processar imagem. Verifique se o arquivo é uma imagem válida (PNG, JPG, WEBP)." },
      { status: 500 }
    );
  }
}
