"use client";

import { useState, useRef, useEffect } from "react";
import {
  FileText, Merge, Scissors, Minimize2, Lock, Unlock, RotateCw, Trash2,
  FileImage, Upload, CheckCircle, X, ArrowRight, FilePlus, FileDown,
  Stamp, Hash, SortAsc, Loader2, AlertCircle, Download, RotateCcw,
  Clock, ChevronRight, Zap, Info,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type PDFTool =
  | null | "merge" | "split" | "compress" | "protect" | "unlock" | "rotate"
  | "remove-pages" | "extract-pages" | "images-to-pdf" | "pdf-to-images"
  | "watermark" | "page-numbers" | "rearrange";

interface ToolConfig {
  id: PDFTool;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  category: string;
  comingSoon?: boolean;
}

// ── Tool catalogue ────────────────────────────────────────────────────────────
const tools: ToolConfig[] = [
  { id: "merge",         name: "Merge PDF",        description: "Combine multiple PDFs into one",        icon: Merge,     color: "from-red-500 to-rose-600",      category: "Organize" },
  { id: "split",         name: "Split PDF",         description: "Split a PDF into separate files",       icon: Scissors,  color: "from-blue-500 to-indigo-600",   category: "Organize" },
  { id: "extract-pages", name: "Extract Pages",     description: "Pull specific pages into a new PDF",    icon: FileDown,  color: "from-indigo-500 to-blue-600",   category: "Organize" },
  { id: "rearrange",     name: "Rearrange Pages",   description: "Reorder pages into a custom sequence",  icon: SortAsc,   color: "from-violet-500 to-purple-600", category: "Organize" },
  { id: "rotate",        name: "Rotate Pages",      description: "Rotate all pages in your PDF",          icon: RotateCw,  color: "from-cyan-500 to-teal-600",     category: "Edit"     },
  { id: "remove-pages",  name: "Remove Pages",      description: "Delete specific pages from a PDF",      icon: Trash2,    color: "from-red-400 to-red-600",       category: "Edit"     },
  { id: "watermark",     name: "Add Watermark",     description: "Stamp text watermark on every page",    icon: Stamp,     color: "from-gray-500 to-gray-700",     category: "Edit"     },
  { id: "page-numbers",  name: "Page Numbers",      description: "Number each page automatically",        icon: Hash,      color: "from-teal-500 to-green-600",    category: "Edit"     },
  { id: "compress",      name: "Compress PDF",      description: "Reduce PDF file size",                  icon: Minimize2, color: "from-green-500 to-emerald-600", category: "Optimize" },
  { id: "protect",       name: "Protect PDF",       description: "Mark PDF with a protection notice",     icon: Lock,      color: "from-yellow-500 to-amber-600",  category: "Security" },
  { id: "unlock",        name: "Unlock PDF",        description: "Attempt to remove PDF password",        icon: Unlock,    color: "from-purple-500 to-violet-600", category: "Security" },
  { id: "images-to-pdf", name: "Images to PDF",    description: "Convert JPG / PNG images into a PDF",   icon: FilePlus,  color: "from-orange-500 to-amber-600",  category: "Convert"  },
  { id: "pdf-to-images", name: "PDF to Images",    description: "Extract each page as an image file",    icon: FileImage, color: "from-pink-500 to-rose-600",    category: "Convert",  comingSoon: true },
];

const categories = ["All", "Organize", "Edit", "Convert", "Optimize", "Security"];

// ── Helpers ───────────────────────────────────────────────────────────────────
const RECENT_KEY = "oneapp-pdf-recent";

function saveRecent(toolId: string) {
  try {
    const prev: string[] = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    const updated = [toolId, ...prev.filter((t) => t !== toolId)].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  } catch { /* ignore */ }
}

function formatSize(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ── Home screen ───────────────────────────────────────────────────────────────
export default function PDFToolsModule() {
  const [activeTool,     setActiveTool]     = useState<PDFTool>(null);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [recentTools,    setRecentTools]    = useState<string[]>([]);

  useEffect(() => {
    try { setRecentTools(JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]")); } catch { /* ignore */ }
  }, []);

  const refreshRecent = () => {
    try { setRecentTools(JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]")); } catch { /* ignore */ }
  };

  const filteredTools = categoryFilter === "All"
    ? tools
    : tools.filter((t) => t.category === categoryFilter);

  const categoryCounts = Object.fromEntries(
    categories.slice(1).map((cat) => [cat, tools.filter((t) => t.category === cat).length])
  );

  if (activeTool) {
    const tool = tools.find((t) => t.id === activeTool)!;
    return <PDFToolWorkspace tool={tool} onBack={() => { setActiveTool(null); refreshRecent(); }} />;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-linear-to-r from-red-600 to-rose-700 rounded-2xl p-6 text-white mb-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-48 opacity-10 flex items-center justify-center pointer-events-none">
          <FileText size={140} />
        </div>
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-1">PDF Tools</h2>
          <p className="text-red-100 text-sm mb-4">
            Process PDFs right here — files are never sent to external servers
          </p>
          <div className="flex flex-wrap gap-5">
            {[
              { icon: Zap,   label: `${tools.filter((t) => !t.comingSoon).length} available tools` },
              { icon: Lock,  label: "Private & secure"  },
              { icon: Clock, label: "Instant results"   },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-red-100 text-xs">
                <Icon size={12} /> {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recently used */}
      {recentTools.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Clock size={12} /> Recently Used
          </p>
          <div className="flex flex-wrap gap-2">
            {recentTools.map((tid) => {
              const t = tools.find((x) => x.id === tid);
              if (!t) return null;
              const Icon = t.icon;
              return (
                <button
                  key={tid}
                  onClick={() => setActiveTool(t.id)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 hover:border-red-300 hover:shadow-sm transition-all text-sm text-gray-700 group"
                >
                  <div className={`w-5 h-5 rounded bg-linear-to-br ${t.color} flex items-center justify-center shrink-0`}>
                    <Icon size={11} className="text-white" />
                  </div>
                  {t.name}
                  <ChevronRight size={12} className="text-gray-300 group-hover:text-red-400 transition-colors" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Category tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        <button
          onClick={() => setCategoryFilter("All")}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            categoryFilter === "All" ? "bg-red-100 text-red-700" : "bg-white text-gray-500 hover:bg-gray-50 border"
          }`}
        >
          All <span className="ml-1 text-xs opacity-50">{tools.length}</span>
        </button>
        {categories.slice(1).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              categoryFilter === cat ? "bg-red-100 text-red-700" : "bg-white text-gray-500 hover:bg-gray-50 border"
            }`}
          >
            {cat} <span className="ml-1 text-xs opacity-50">{categoryCounts[cat]}</span>
          </button>
        ))}
      </div>

      {/* Tool grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => { if (!tool.comingSoon) setActiveTool(tool.id); }}
              disabled={!!tool.comingSoon}
              className={`bg-white rounded-xl border p-5 text-left transition-all duration-200 group relative ${
                tool.comingSoon
                  ? "opacity-60 cursor-not-allowed border-gray-200"
                  : "border-gray-200 hover:shadow-lg hover:border-red-200"
              }`}
            >
              {tool.comingSoon && (
                <span className="absolute top-3 right-3 text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                  Soon
                </span>
              )}
              <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${tool.color} flex items-center justify-center mb-3 transition-transform ${!tool.comingSoon ? "group-hover:scale-110" : ""}`}>
                <Icon size={24} className="text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 text-sm">{tool.name}</h4>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{tool.description}</p>
              {!tool.comingSoon && (
                <div className="mt-3 flex items-center gap-1 text-xs text-gray-400 group-hover:text-red-500 transition-colors">
                  Use Tool <ArrowRight size={12} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Tool workspace ────────────────────────────────────────────────────────────
function PDFToolWorkspace({ tool, onBack }: { tool: ToolConfig; onBack: () => void }) {
  const [files,      setFiles]      = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress,   setProgress]   = useState(0);
  const [done,       setDone]       = useState(false);
  const [error,      setError]      = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [downloadUrl,setDownloadUrl]= useState("");
  const [stats,      setStats]      = useState<{ before: number; after: number } | null>(null);
  const [options,    setOptions]    = useState({
    password:           "",
    watermarkText:      "CONFIDENTIAL",
    watermarkOpacity:   0.3,
    watermarkPosition:  "center",
    rotation:           90,
    pagesToExtract:     "1-3",
    pagesToRemove:      "2",
    compressionLevel:   "medium",
    pageNumberPosition: "bottom-center",
    splitEvery:         1,
    pageOrder:          "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const urlRef       = useRef("");

  const acceptTypes = tool.id === "images-to-pdf" ? "image/png,image/jpeg,image/jpg" : ".pdf,application/pdf";
  const isMulti     = tool.id === "merge" || tool.id === "images-to-pdf";
  const IconComp    = tool.icon;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  const isValidFile = (file: File) => {
    if (tool.id === "images-to-pdf") return file.type.startsWith("image/");
    return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const valid = Array.from(e.target.files).filter(isValidFile);
    setFiles((prev) => [...prev, ...valid]);
    setError("");
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const valid = Array.from(e.dataTransfer.files).filter(isValidFile);
    if (!valid.length) {
      setError(tool.id === "images-to-pdf" ? "Please drop image files (JPG or PNG)." : "Please drop PDF files only.");
      return;
    }
    setFiles((prev) => [...prev, ...valid]);
    setError("");
  };

  const removeFile = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i));
  const totalSize  = files.reduce((sum, f) => sum + f.size, 0);

  const startProgress = () => {
    setProgress(5);
    progressRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 80) { clearInterval(progressRef.current!); return 80; }
        return p + (80 - p) * 0.07;
      });
    }, 120);
  };

  const processFiles = async () => {
    if (!files.length) return;
    setError("");
    setProcessing(true);
    startProgress();

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      formData.append("tool", tool.id!);
      formData.append("options", JSON.stringify(options));

      const res = await fetch("/api/pdf", { method: "POST", body: formData });

      if (!res.ok) {
        let msg = "Processing failed. Please try again.";
        try { const j = await res.json(); msg = j.error ?? msg; } catch { /* ignore */ }
        throw new Error(msg);
      }

      const blob = await res.blob();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const url  = URL.createObjectURL(blob);
      urlRef.current = url;
      setDownloadUrl(url);

      // Auto-trigger download
      const a   = document.createElement("a");
      a.href    = url;
      a.download = `${tool.id}-result.pdf`;
      a.click();

      setStats({ before: totalSize, after: blob.size });
      saveRecent(tool.id!);

      if (progressRef.current) clearInterval(progressRef.current);
      setProgress(100);
      setTimeout(() => setProgress(0), 600);
      setDone(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(msg);
      if (progressRef.current) clearInterval(progressRef.current);
      setProgress(0);
    }

    setProcessing(false);
  };

  const reset = () => {
    setDone(false);
    setFiles([]);
    setError("");
    setStats(null);
    if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = ""; setDownloadUrl(""); }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm mb-5">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-700 transition-colors">
          PDF Tools
        </button>
        <ChevronRight size={14} className="text-gray-300" />
        <span className="text-gray-700 font-medium">{tool.name}</span>
      </div>

      {/* Tool header card */}
      <div className="bg-white rounded-2xl border p-5 mb-5 flex items-center gap-4">
        <div className={`w-14 h-14 rounded-xl bg-linear-to-br ${tool.color} flex items-center justify-center shrink-0`}>
          <IconComp size={28} className="text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-gray-900">{tool.name}</h2>
            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">{tool.category}</span>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">{tool.description}</p>
        </div>
      </div>

      {/* Progress bar */}
      {progress > 0 && (
        <div className="mb-5 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-red-500 to-rose-400 rounded-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-700">Error</p>
            <p className="text-xs text-red-500 mt-0.5">{error}</p>
          </div>
          <button onClick={() => setError("")} className="text-red-300 hover:text-red-500 transition-colors">
            <X size={14} />
          </button>
        </div>
      )}

      {done ? (
        /* ── Success state ─────────────────────────────────────────────────── */
        <div className="bg-white rounded-2xl border p-10 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">Done!</h3>
          <p className="text-sm text-gray-400 mb-6">Your file was processed and downloaded automatically.</p>

          {/* Compress stats */}
          {stats && tool.id === "compress" && (
            <div className="flex justify-center gap-8 mb-7">
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">Original</p>
                <p className="font-semibold text-gray-700">{formatSize(stats.before)}</p>
              </div>
              <div className="flex items-center text-gray-300 text-xl">→</div>
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">Compressed</p>
                <p className={`font-semibold ${stats.after < stats.before ? "text-green-600" : "text-gray-700"}`}>
                  {formatSize(stats.after)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">Saved</p>
                <p className="font-semibold text-green-600">
                  {stats.before > 0 ? `${Math.max(0, Math.round((1 - stats.after / stats.before) * 100))}%` : "—"}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-3">
            {downloadUrl && (
              <a
                href={downloadUrl}
                download={`${tool.id}-result.pdf`}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 text-sm font-medium transition-colors"
              >
                <Download size={15} /> Download Again
              </a>
            )}
            <button
              onClick={reset}
              className="flex items-center gap-2 px-5 py-2.5 border rounded-xl hover:bg-gray-50 text-sm text-gray-600 transition-colors"
            >
              <RotateCcw size={14} /> Process Another
            </button>
            <button onClick={onBack} className="px-5 py-2.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
              ← All Tools
            </button>
          </div>
        </div>
      ) : (
        /* ── Upload + options state ────────────────────────────────────────── */
        <>
          {/* Drop zone */}
          <div
            className={`rounded-2xl border-2 border-dashed p-10 text-center mb-5 cursor-pointer transition-all duration-150 ${
              isDragOver
                ? "border-red-400 bg-red-50 scale-[1.01]"
                : "border-gray-200 bg-white hover:border-red-300 hover:bg-gray-50"
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOver(false); }}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptTypes}
              multiple={isMulti}
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload
              size={40}
              className={`mx-auto mb-3 transition-colors ${isDragOver ? "text-red-500" : "text-gray-300"}`}
            />
            <p className={`text-base font-semibold mb-1 transition-colors ${isDragOver ? "text-red-600" : "text-gray-700"}`}>
              {isDragOver
                ? "Drop to upload"
                : tool.id === "images-to-pdf"
                  ? "Drop JPG or PNG images here"
                  : `Drop PDF file${isMulti ? "s" : ""} here`}
            </p>
            <p className="text-sm text-gray-400">
              {isMulti ? "Multiple files supported · " : ""}
              or <span className="text-red-500 font-medium">browse files</span>
            </p>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="bg-white rounded-xl border mb-5">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h4 className="text-sm font-semibold text-gray-700">
                  {files.length} file{files.length !== 1 ? "s" : ""} selected
                </h4>
                <span className="text-xs text-gray-400">Total: {formatSize(totalSize)}</span>
              </div>
              <div className="p-2 space-y-1">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 group">
                    <FileText size={16} className="text-red-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate leading-tight">{file.name}</p>
                      <p className="text-xs text-gray-400">{formatSize(file.size)}</p>
                    </div>
                    <button
                      onClick={() => removeFile(i)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-red-100 text-gray-400 hover:text-red-500 transition-all"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Per-tool options */}
          {files.length > 0 && (
            <div className="bg-white rounded-xl border p-4 mb-5">
              <h4 className="text-sm font-semibold text-gray-700 mb-4">Options</h4>
              <ToolOptions toolId={tool.id!} options={options} setOptions={setOptions} />
            </div>
          )}

          {/* Process button */}
          {files.length > 0 && (
            <button
              onClick={processFiles}
              disabled={processing}
              className="w-full py-3.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              {processing
                ? <><Loader2 size={18} className="animate-spin" /> Processing…</>
                : <><IconComp size={18} /> {tool.name}</>
              }
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ── Per-tool options panels ───────────────────────────────────────────────────
function ToolOptions({
  toolId,
  options,
  setOptions,
}: {
  toolId: string;
  options: Record<string, unknown>;
  setOptions: (opts: Record<string, unknown>) => void;
}) {
  switch (toolId) {
    case "protect":
      return (
        <div className="space-y-3">
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <Info size={14} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700 leading-relaxed">
              Full PDF encryption requires server infrastructure. This tool stamps a protection notice into the file metadata.
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Protection label</label>
            <input
              type="text"
              value={options.password as string}
              onChange={(e) => setOptions({ ...options, password: e.target.value })}
              placeholder="e.g. CONFIDENTIAL"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-200 outline-none"
            />
          </div>
        </div>
      );

    case "unlock":
      return (
        <div className="space-y-3">
          <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl p-3">
            <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700 leading-relaxed">
              If you know the PDF password, enter it below. If the file is not password-protected it will be returned as-is.
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">PDF Password (optional)</label>
            <input
              type="password"
              value={options.password as string}
              onChange={(e) => setOptions({ ...options, password: e.target.value })}
              placeholder="Enter password if known"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-200 outline-none"
            />
          </div>
        </div>
      );

    case "rotate":
      return (
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Rotation Angle</label>
          <div className="flex gap-2">
            {[90, 180, 270].map((angle) => (
              <button
                key={angle}
                onClick={() => setOptions({ ...options, rotation: angle })}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  options.rotation === angle
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                {angle}°
              </button>
            ))}
          </div>
        </div>
      );

    case "split":
      return (
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Split mode</label>
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setOptions({ ...options, splitEvery: 1 })}
              className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${
                options.splitEvery === 1
                  ? "border-red-500 bg-red-50 text-red-700"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              Individual pages
            </button>
            <button
              onClick={() => setOptions({ ...options, splitEvery: options.splitEvery === 1 ? 2 : options.splitEvery })}
              className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${
                (options.splitEvery as number) > 1
                  ? "border-red-500 bg-red-50 text-red-700"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              Every N pages
            </button>
          </div>
          {(options.splitEvery as number) > 1 && (
            <input
              type="number"
              min="2"
              value={options.splitEvery as number}
              onChange={(e) => setOptions({ ...options, splitEvery: Math.max(2, parseInt(e.target.value) || 2) })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-200 outline-none"
              placeholder="Pages per file"
            />
          )}
        </div>
      );

    case "extract-pages":
      return (
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Pages to extract</label>
          <input
            type="text"
            value={options.pagesToExtract as string}
            onChange={(e) => setOptions({ ...options, pagesToExtract: e.target.value })}
            placeholder="e.g. 1-3, 5, 7-9"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-200 outline-none"
          />
          <p className="text-xs text-gray-400 mt-1.5">
            Separate ranges with commas. Example: <span className="font-mono text-gray-600">1, 3-5, 8</span>
          </p>
        </div>
      );

    case "remove-pages":
      return (
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Pages to remove</label>
          <input
            type="text"
            value={options.pagesToRemove as string}
            onChange={(e) => setOptions({ ...options, pagesToRemove: e.target.value })}
            placeholder="e.g. 2, 4-6"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-200 outline-none"
          />
          <p className="text-xs text-gray-400 mt-1.5">
            Use commas and dashes. Example: <span className="font-mono text-gray-600">2, 4-6</span>
          </p>
        </div>
      );

    case "compress":
      return (
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Compression Level</label>
          <div className="flex gap-2">
            {[
              { value: "low",    label: "Low",    desc: "Best quality"  },
              { value: "medium", label: "Medium", desc: "Balanced"      },
              { value: "high",   label: "High",   desc: "Smallest size" },
            ].map(({ value, label, desc }) => (
              <button
                key={value}
                onClick={() => setOptions({ ...options, compressionLevel: value })}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all text-center ${
                  options.compressionLevel === value
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <div>{label}</div>
                <div className="text-[10px] opacity-60 mt-0.5 font-normal">{desc}</div>
              </button>
            ))}
          </div>
        </div>
      );

    case "watermark":
      return (
        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Watermark text</label>
            <input
              type="text"
              value={options.watermarkText as string}
              onChange={(e) => setOptions({ ...options, watermarkText: e.target.value })}
              placeholder="e.g. CONFIDENTIAL"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-200 outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Opacity — <span className="text-red-600 font-semibold">{Math.round((options.watermarkOpacity as number) * 100)}%</span>
            </label>
            <input
              type="range"
              min="10"
              max="80"
              step="10"
              value={Math.round((options.watermarkOpacity as number) * 100)}
              onChange={(e) => setOptions({ ...options, watermarkOpacity: Number(e.target.value) / 100 })}
              className="w-full accent-red-500"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
              <span>Subtle</span><span>Bold</span>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Position</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { value: "top-left",     label: "↖ Top Left"   },
                { value: "top-center",   label: "↑ Top Center" },
                { value: "top-right",    label: "Top Right ↗"  },
                { value: "bottom-left",  label: "↙ Bot Left"   },
                { value: "center",       label: "⊕ Center"     },
                { value: "bottom-right", label: "Bot Right ↘"  },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setOptions({ ...options, watermarkPosition: value })}
                  className={`py-2 rounded-lg border text-xs font-medium transition-all ${
                    options.watermarkPosition === value
                      ? "border-red-500 bg-red-50 text-red-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      );

    case "page-numbers":
      return (
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Position</label>
          <div className="grid grid-cols-3 gap-2">
            {["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"].map((pos) => (
              <button
                key={pos}
                onClick={() => setOptions({ ...options, pageNumberPosition: pos })}
                className={`py-2 rounded-xl border text-xs capitalize transition-all ${
                  options.pageNumberPosition === pos
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                {pos.replace("-", " ")}
              </button>
            ))}
          </div>
        </div>
      );

    case "rearrange":
      return (
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">New page order</label>
          <input
            type="text"
            value={options.pageOrder as string}
            onChange={(e) => setOptions({ ...options, pageOrder: e.target.value })}
            placeholder="e.g. 3, 1, 2  (leave blank to reverse)"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-200 outline-none"
          />
          <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
            Enter page numbers separated by commas in the desired output order.{" "}
            <span className="font-mono text-gray-600">3, 1, 2</span> puts page 3 first, then 1, then 2.
            Leave blank to reverse the page order.
          </p>
        </div>
      );

    default:
      return <p className="text-sm text-gray-400">No additional options needed for this tool.</p>;
  }
}
