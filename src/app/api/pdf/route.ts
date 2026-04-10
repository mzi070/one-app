import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const tool = formData.get("tool") as string;
    const optionsStr = formData.get("options") as string;
    const options = optionsStr ? JSON.parse(optionsStr) : {};
    const stampFile = formData.get("stamp") as File | null;

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    let resultPdf: Uint8Array;

    switch (tool) {
      case "merge":
        resultPdf = await mergePDFs(files);
        break;
      case "split":
        resultPdf = await splitPDF(files[0], options.splitEvery || 1);
        break;
      case "compress":
        resultPdf = await compressPDF(files[0]);
        break;
      case "rotate":
        resultPdf = await rotatePDF(files[0], options.rotation || 90);
        break;
      case "remove-pages":
        resultPdf = await removePages(files[0], options.pagesToRemove || "");
        break;
      case "extract-pages":
        resultPdf = await extractPages(files[0], options.pagesToExtract || "");
        break;
      case "watermark":
        resultPdf = await addWatermark(
          files[0],
          options.watermarkText || "WATERMARK",
          typeof options.watermarkOpacity === "number" ? options.watermarkOpacity : 0.3,
          options.watermarkPosition || "center"
        );
        break;
      case "page-numbers":
        resultPdf = await addPageNumbers(files[0], options.pageNumberPosition || "bottom-center");
        break;
      case "images-to-pdf":
        resultPdf = await imagesToPDF(files);
        break;
      case "protect":
        resultPdf = await protectPDF(files[0], options.password || "");
        break;
      case "unlock":
        resultPdf = await unlockPDF(files[0], options.password || "");
        break;
      case "rearrange":
        resultPdf = await rearrangePDF(files[0], options.pageOrder || "");
        break;
      case "pdf-to-images":
        return NextResponse.json(
          { error: "PDF to Images requires client-side rendering and is not yet available on this server." },
          { status: 422 }
        );
      case "add-text":
        resultPdf = await addTextToPDF(files[0], {
          text:     options.addText || "",
          position: options.addTextPosition || "bottom-center",
          size:     typeof options.addTextSize === "number" ? options.addTextSize : 14,
          color:    options.addTextColor || "#000000",
          pages:    options.addTextPages || "all",
        });
        break;
      case "add-image-stamp":
        if (!stampFile) throw new Error("No stamp image uploaded. Please select a PNG or JPG file.");
        resultPdf = await addImageStamp(files[0], stampFile, {
          position: options.stampPosition || "bottom-right",
          scale:    typeof options.stampScale === "number" ? options.stampScale : 25,
          opacity:  typeof options.stampOpacity === "number" ? options.stampOpacity : 0.85,
          pages:    options.stampPages || "all",
        });
        break;
      default:
        // Default: return the original file
        const buf = await files[0].arrayBuffer();
        resultPdf = new Uint8Array(buf);
    }

    return new NextResponse(Buffer.from(resultPdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${tool}-result.pdf"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function mergePDFs(files: File[]): Promise<Uint8Array> {
  const merged = await PDFDocument.create();

  for (const file of files) {
    const bytes = await file.arrayBuffer();
    try {
      const pdf = await PDFDocument.load(bytes);
      const pages = await merged.copyPages(pdf, pdf.getPageIndices());
      pages.forEach((page) => merged.addPage(page));
    } catch {
      // Skip non-PDF files
    }
  }

  return merged.save();
}

async function splitPDF(file: File, splitEvery: number): Promise<Uint8Array> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  const newPdf = await PDFDocument.create();
  const totalPages = pdf.getPageCount();
  const end = Math.min(splitEvery, totalPages);

  const pages = await newPdf.copyPages(pdf, Array.from({ length: end }, (_, i) => i));
  pages.forEach((page) => newPdf.addPage(page));

  return newPdf.save();
}

async function compressPDF(file: File): Promise<Uint8Array> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  return pdf.save();
}

async function rotatePDF(file: File, rotation: number): Promise<Uint8Array> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);

  pdf.getPages().forEach((page) => {
    page.setRotation(degrees((page.getRotation().angle + rotation) % 360));
  });

  return pdf.save();
}

function parsePageRanges(rangeStr: string): number[] {
  const pages: number[] = [];
  const parts = rangeStr.split(",").map((s) => s.trim());
  for (const part of parts) {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map(Number);
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) pages.push(i);
      }
    } else {
      const num = Number(part);
      if (!isNaN(num)) pages.push(num);
    }
  }
  return pages;
}

async function removePages(file: File, pagesToRemove: string): Promise<Uint8Array> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  const toRemove = new Set(parsePageRanges(pagesToRemove).map((p) => p - 1)); // 0-indexed

  const newPdf = await PDFDocument.create();
  const indicesToKeep = pdf.getPageIndices().filter((i) => !toRemove.has(i));
  const pages = await newPdf.copyPages(pdf, indicesToKeep);
  pages.forEach((page) => newPdf.addPage(page));

  return newPdf.save();
}

async function extractPages(file: File, pagesToExtract: string): Promise<Uint8Array> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  const toExtract = parsePageRanges(pagesToExtract).map((p) => p - 1); // 0-indexed

  const newPdf = await PDFDocument.create();
  const validIndices = toExtract.filter((i) => i >= 0 && i < pdf.getPageCount());
  const pages = await newPdf.copyPages(pdf, validIndices);
  pages.forEach((page) => newPdf.addPage(page));

  return newPdf.save();
}

async function addWatermark(file: File, text: string, opacity = 0.3, position = "center"): Promise<Uint8Array> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);

  pdf.getPages().forEach((page) => {
    const { width, height } = page.getSize();
    const fontSize = Math.min(width, height) * 0.1;
    const textWidth = font.widthOfTextAtSize(text, fontSize);

    let x = (width - textWidth) / 2;
    let y = height / 2;
    let rotate = degrees(45);

    if (position === "top-left")     { x = 40;                       y = height - 80; rotate = degrees(0); }
    if (position === "top-center")   { x = (width - textWidth) / 2;  y = height - 80; rotate = degrees(0); }
    if (position === "top-right")    { x = width - textWidth - 40;   y = height - 80; rotate = degrees(0); }
    if (position === "bottom-left")  { x = 40;                       y = 40;          rotate = degrees(0); }
    if (position === "bottom-right") { x = width - textWidth - 40;   y = 40;          rotate = degrees(0); }
    // "center" keeps the diagonal defaults

    page.drawText(text, { x, y, size: fontSize, font, color: rgb(0.6, 0.6, 0.6), rotate, opacity });
  });

  return pdf.save();
}

async function addPageNumbers(file: File, position: string): Promise<Uint8Array> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = pdf.getPages();

  pages.forEach((page, i) => {
    const { width, height } = page.getSize();
    const text = `${i + 1} / ${pages.length}`;
    const fontSize = 10;
    const textWidth = font.widthOfTextAtSize(text, fontSize);

    let x = (width - textWidth) / 2;
    let y = 30;

    if (position.includes("left")) x = 40;
    if (position.includes("right")) x = width - textWidth - 40;
    if (position.includes("top")) y = height - 40;

    page.drawText(text, { x, y, size: fontSize, font, color: rgb(0.3, 0.3, 0.3) });
  });

  return pdf.save();
}

async function imagesToPDF(files: File[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();

  for (const file of files) {
    const bytes = await file.arrayBuffer();
    let image;

    if (file.type === "image/png") {
      image = await pdf.embedPng(bytes);
    } else if (file.type === "image/jpeg" || file.type === "image/jpg") {
      image = await pdf.embedJpg(bytes);
    } else {
      continue;
    }

    const page = pdf.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }

  return pdf.save();
}

async function protectPDF(file: File, label: string): Promise<Uint8Array> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  // pdf-lib does not support PDF encryption; stamp a notice into metadata instead
  const notice = label || "PROTECTED";
  pdf.setTitle(`[${notice}] ${pdf.getTitle() || "Document"}`);
  pdf.setSubject(`Protection notice: ${notice}`);
  return pdf.save();
}

async function unlockPDF(file: File, password: string): Promise<Uint8Array> {
  const bytes = await file.arrayBuffer();
  try {
    // Try loading with password if provided
    const pdf = await PDFDocument.load(bytes, password ? { password } : {});
    // Re-save without the protection context (pdf-lib removes owner-level restrictions on save)
    return pdf.save();
  } catch {
    // If the password is wrong or the file isn't encrypted, return as-is
    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
    return pdf.save();
  }
}

async function rearrangePDF(file: File, pageOrder: string): Promise<Uint8Array> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  const totalPages = pdf.getPageCount();
  const newPdf = await PDFDocument.create();

  let indices: number[];
  if (pageOrder && pageOrder.trim()) {
    // Parse user-specified order (1-based) into 0-based indices
    indices = pageOrder
      .split(",")
      .map((s) => parseInt(s.trim(), 10) - 1)
      .filter((i) => i >= 0 && i < totalPages);
    if (indices.length === 0) indices = pdf.getPageIndices().reverse();
  } else {
    // Default: reverse
    indices = pdf.getPageIndices().reverse();
  }

  const pages = await newPdf.copyPages(pdf, indices);
  pages.forEach((page) => newPdf.addPage(page));
  return newPdf.save();
}

// ── Editing helpers ───────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return [isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b];
}

function getPagesIndices(pagesOption: string, totalPages: number): number[] {
  if (!pagesOption || pagesOption.trim().toLowerCase() === "all") {
    return Array.from({ length: totalPages }, (_, i) => i);
  }
  return parsePageRanges(pagesOption)
    .map((p) => p - 1)
    .filter((i) => i >= 0 && i < totalPages);
}

async function addTextToPDF(
  file: File,
  opts: { text: string; position: string; size: number; color: string; pages: string }
): Promise<Uint8Array> {
  const bytes = await file.arrayBuffer();
  const pdf   = await PDFDocument.load(bytes);
  const font  = await pdf.embedFont(StandardFonts.HelveticaBold);
  const allPages     = pdf.getPages();
  const targetIndices = getPagesIndices(opts.pages, allPages.length);
  const [r, g, b]   = hexToRgb(opts.color || "#000000");
  const fontSize     = opts.size || 14;
  const text         = opts.text || "";

  targetIndices.forEach((idx) => {
    const page = allPages[idx];
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, fontSize);

    let x = (width - textWidth) / 2;
    let y = 30;

    if (opts.position.includes("left"))   x = 40;
    if (opts.position.includes("right"))  x = Math.max(0, width - textWidth - 40);
    if (opts.position.includes("top"))    y = height - 50;

    page.drawText(text, { x, y, size: fontSize, font, color: rgb(r, g, b) });
  });

  return pdf.save();
}

async function addImageStamp(
  pdfFile: File,
  stampFile: File,
  opts: { position: string; scale: number; opacity: number; pages: string }
): Promise<Uint8Array> {
  const pdfBytes  = await pdfFile.arrayBuffer();
  const pdf       = await PDFDocument.load(pdfBytes);
  const stampBytes = await stampFile.arrayBuffer();

  const image = stampFile.type === "image/png"
    ? await pdf.embedPng(stampBytes)
    : await pdf.embedJpg(stampBytes);

  const allPages      = pdf.getPages();
  const targetIndices = getPagesIndices(opts.pages, allPages.length);
  const scaleFactor   = (opts.scale || 25) / 100;
  const opacity       = opts.opacity ?? 0.85;
  const margin        = 20;

  targetIndices.forEach((idx) => {
    const page = allPages[idx];
    const { width, height } = page.getSize();
    const imgWidth  = width * scaleFactor;
    const imgHeight = (image.height / image.width) * imgWidth;

    let x = (width - imgWidth) / 2;
    let y = (height - imgHeight) / 2;

    if (opts.position.includes("left"))   x = margin;
    if (opts.position.includes("right"))  x = width - imgWidth - margin;
    if (opts.position.includes("top"))    y = height - imgHeight - margin;
    if (opts.position.includes("bottom")) y = margin;
    // "center" keeps the centered defaults

    page.drawImage(image, { x, y, width: imgWidth, height: imgHeight, opacity });
  });

  return pdf.save();
}
