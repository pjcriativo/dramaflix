import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando o seed do banco de dados...");

  // 1. Criar usuário administrador padrão
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@dramaflix.com" },
    update: {},
    create: {
      email: "admin@dramaflix.com",
      name: "Administrador Dramaflix",
      passwordHash: adminPassword,
      role: "ADMIN",
      coinsBalance: 9999,
      isVip: true,
      vipPlan: "anual",
    },
  });
  console.log(`👤 Usuário Admin criado/verificado: ${admin.email} (senha: admin123)`);

  // 2. Criar usuário cliente de demonstração
  const userPassword = await bcrypt.hash("user123", 10);
  const user = await prisma.user.upsert({
    where: { email: "usuario@dramaflix.com" },
    update: {},
    create: {
      email: "usuario@dramaflix.com",
      name: "Usuário Teste",
      passwordHash: userPassword,
      role: "USER",
      coinsBalance: 120,
      isVip: false,
    },
  });
  console.log(`👤 Usuário Cliente criado/verificado: ${user.email} (senha: user123)`);

  // 3. Ler dados gerados do catálogo existente
  const titulosPath = path.join(__dirname, "../src/data/titulos.gerado.json");
  const videosPath = path.join(__dirname, "../src/data/videos.gerado.json");

  const titulos = JSON.parse(fs.readFileSync(titulosPath, "utf-8"));
  const videos = JSON.parse(fs.readFileSync(videosPath, "utf-8"));

  console.log(`📚 Importando ${titulos.length} séries para o banco SQLite...`);

  for (const t of titulos) {
    const videoInfo = videos[t.id] || {};
    const arquivo = t.arquivo || t.id;

    // Classificação baseada no gênero/conteúdo
    let classificacao = "A14";
    if (t.genero.toLowerCase().includes("terror") || t.genero.toLowerCase().includes("suspense")) {
      classificacao = "A16";
    } else if (t.genero.toLowerCase().includes("comédia") || t.genero.toLowerCase().includes("romance leve")) {
      classificacao = "A10";
    }

    const drama = await prisma.drama.upsert({
      where: { id: t.id },
      update: {
        titulo: t.titulo,
        genero: t.genero,
        sinopse: t.sinopse,
        gancho: t.gancho,
        episodiosTotal: t.episodios || 60,
        gratisAte: 10,
        moedasPorEpisodio: 40,
        classificacao,
        dublado: Boolean(t.dublado),
        emAlta: t.numero,
        capa: `/capas/${arquivo}.webp`,
        foto: `/fotos/${arquivo}.webp`,
        banner: `/banners/${arquivo}.webp`,
        logo: `/logos/${arquivo}.webp`,
        logoWidth: t.logo?.w || 1000,
        logoHeight: t.logo?.h || 500,
        cor: t.cor || "#14100d",
        tags: JSON.stringify(t.tags || []),
        amostraVideo: videoInfo.amostra || null,
        previaVideo: videoInfo.previa || null,
      },
      create: {
        id: t.id,
        numero: t.numero,
        titulo: t.titulo,
        genero: t.genero,
        sinopse: t.sinopse,
        gancho: t.gancho,
        episodiosTotal: t.episodios || 60,
        gratisAte: 10,
        moedasPorEpisodio: 40,
        classificacao,
        dublado: Boolean(t.dublado),
        emAlta: t.numero,
        capa: `/capas/${arquivo}.webp`,
        foto: `/fotos/${arquivo}.webp`,
        banner: `/banners/${arquivo}.webp`,
        logo: `/logos/${arquivo}.webp`,
        logoWidth: t.logo?.w || 1000,
        logoHeight: t.logo?.h || 500,
        cor: t.cor || "#14100d",
        tags: JSON.stringify(t.tags || []),
        amostraVideo: videoInfo.amostra || null,
        previaVideo: videoInfo.previa || null,
      },
    });

    // Episódios reais cadastrados
    const episodiosReais = videoInfo.episodios || {};
    const totalEps = drama.episodiosTotal;

    for (let epNum = 1; epNum <= totalEps; epNum++) {
      const epStr = String(epNum);
      const videoUrl =
        episodiosReais[epStr] ||
        (videoInfo.amostra ? videoInfo.amostra : `/videos/${drama.id}/amostra.mp4`);

      await prisma.episode.upsert({
        where: {
          dramaId_numero: {
            dramaId: drama.id,
            numero: epNum,
          },
        },
        update: {
          videoUrl,
          gratis: epNum <= drama.gratisAte,
        },
        create: {
          dramaId: drama.id,
          numero: epNum,
          titulo: `Episódio ${epNum}`,
          videoUrl,
          duracaoSegundos: 90,
          gratis: epNum <= drama.gratisAte,
        },
      });
    }
  }

  console.log("✅ Seed concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error("❌ Erro durante o seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
