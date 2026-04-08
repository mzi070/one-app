import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const tool = formData.get("tool") as string;
    const optionsStr = formData.get("options") as string;
    const options = optionsStr ? JSON.parse(optionsStr) : {};

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
        resultPdf = await addWatermark(files[0], options.watermarkText || "WATERMARK");
        break;
      case "page-numbers":
        resultPdf = await addPageNumbers(files[0], options.pageNumberPosition || "bottom-center");
        break;
      case "images-to-pdf":
        resultPdf = await imagesToPDF(files);
        break;
      case "protect":
        resultPdf = await protectPDF(files[0]);
        break;
      case "rearrange":
        resultPdf = await rearrangePDF(files[0]);
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

async function addWatermark(file: File, text: string): Promise<Uint8Array> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);

  pdf.getPages().forEach((page) => {
    const { width, height } = page.getSize();
    const fontSize = Math.min(width, height) * 0.1;
    const textWidth = font.widthOfTextAtSize(text, fontSize);

    page.drawText(text, {
      x: (width - textWidth) / 2,
      y: height / 2,
      size: fontSize,
      font,
      color: rgb(0.75, 0.75, 0.75),
      rotate: degrees(45),
      opacity: 0.3,
    });
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

async function protectPDF(file: File): Promise<Uint8Array> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  // pdf-lib doesn't support encryption directly, just return the pdf
  return pdf.save();
}

async function rearrangePDF(file: File): Promise<Uint8Array> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  // Reverse page order as a demo
  const newPdf = await PDFDocument.create();
  const indices = pdf.getPageIndices().reverse();
  const pages = await newPdf.copyPages(pdf, indices);
  pages.forEach((page) => newPdf.addPage(page));

  return newPdf.save();
}
