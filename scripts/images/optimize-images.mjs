import fs from "fs";
import path from "path";
import sharp from "sharp";

const INPUT_DIR = path.join(process.cwd(), "public", "images", "raw_images");
const OUTPUT_DIR = path.join(process.cwd(), "public", "images", "images");

// Config à ajuster selon ton besoin
const MAX_WIDTH = 1920; // largeur max pour les images hero
const AVIF_QUALITY = 60; // 50–60 = très bonne perf / qualité ok

const VALID_EXT = [".jpg", ".jpeg", ".png", ".JPG", ".JPEG", ".PNG"];

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function getAllFiles(dir) {
  const dirents = await fs.promises.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map((dirent) => {
      const res = path.resolve(dir, dirent.name);
      return dirent.isDirectory() ? getAllFiles(res) : res;
    })
  );
  return Array.prototype.concat(...files);
}

async function optimizeImage(inputPath) {
  const relPath = path.relative(INPUT_DIR, inputPath);
  const ext = path.extname(relPath);
  const baseName = relPath.slice(0, -ext.length);

  if (!VALID_EXT.includes(ext)) {
    return;
  }

  const outputPathAvif = path.join(OUTPUT_DIR, `${baseName}.avif`);
  await ensureDir(path.dirname(outputPathAvif));

  console.log(`→ Optimise ${relPath} …`);

  const image = sharp(inputPath, { failOnError: false });

  // On resize pour éviter les 4000–6000px inutiles
  await image
    .resize({
      width: MAX_WIDTH,
      withoutEnlargement: true,
    })
    .avif({
      quality: AVIF_QUALITY,
      // chromaSubsampling par défaut, suffisant pour le web
    })
    .toFile(outputPathAvif);

  console.log(`   ✔ AVIF → ${path.relative(process.cwd(), outputPathAvif)}`);
}

// Optionnel : si tu veux aussi un fallback WebP
async function optimizeImageWithWebp(inputPath) {
  const relPath = path.relative(INPUT_DIR, inputPath);
  const ext = path.extname(relPath);
  const baseName = relPath.slice(0, -ext.length);

  if (!VALID_EXT.includes(ext)) {
    return;
  }

  const outputPathAvif = path.join(OUTPUT_DIR, `${baseName}.avif`);
  const outputPathWebp = path.join(OUTPUT_DIR, `${baseName}.webp`);
  await ensureDir(path.dirname(outputPathAvif));

  console.log(`→ Optimise ${relPath} (AVIF + WebP)…`);

  const pipeline = sharp(inputPath, { failOnError: false }).resize({
    width: MAX_WIDTH,
    withoutEnlargement: true,
  });

  // clone() pour réutiliser le même decode/resize
  await Promise.all([
    pipeline
      .clone()
      .avif({ quality: AVIF_QUALITY })
      .toFile(outputPathAvif),
    pipeline.clone().webp({ quality: 80 }).toFile(outputPathWebp),
  ]);

  console.log(`   ✔ AVIF  → ${path.relative(process.cwd(), outputPathAvif)}`);
  console.log(`   ✔ WebP  → ${path.relative(process.cwd(), outputPathWebp)}`);
}

async function main() {
  await ensureDir(OUTPUT_DIR);
  const files = await getAllFiles(INPUT_DIR);

  const imgFiles = files.filter((f) =>
    VALID_EXT.includes(path.extname(f))
  );

  console.log(`Found ${imgFiles.length} images to optimize.`);

  for (const file of imgFiles) {
    // Choisis la version simple AVIF OU AVIF+WebP
    await optimizeImage(file);
    // ou :
    // await optimizeImageWithWebp(file);
  }

  console.log("✅ Optimisation terminée.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});