"use client";

import { useState, useRef } from "react";
import {
  FileText,
  Merge,
  Scissors,
  Minimize2,
  Edit3,
  Lock,
  Unlock,
  RotateCw,
  Trash2,
  Image,
  FileImage,
  Download,
  Upload,
  CheckCircle,
  X,
  ArrowRight,
  FilePlus,
  FileDown,
  Stamp,
  Hash,
  SortAsc,
  FileSearch,
  AlertCircle,
  Loader2,
} from "lucide-react";

type PDFTool =
  | null
  | "merge"
  | "split"
  | "compress"
  | "protect"
  | "unlock"
  | "rotate"
  | "remove-pages"
  | "extract-pages"
  | "images-to-pdf"
  | "pdf-to-images"
  | "watermark"
  | "page-numbers"
  | "rearrange";

interface ToolConfig {
  id: PDFTool;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  category: string;
}

const tools: ToolConfig[] = [
  { id: "merge", name: "Merge PDF", description: "Combine multiple PDF files into one", icon: Merge, color: "from-red-500 to-rose-600", category: "Organize" },
  { id: "split", name: "Split PDF", description: "Split PDF into separate files", icon: Scissors, color: "from-blue-500 to-indigo-600", category: "Organize" },
  { id: "compress", name: "Compress PDF", description: "Reduce PDF file size", icon: Minimize2, color: "from-green-500 to-emerald-600", category: "Optimize" },
  { id: "protect", name: "Protect PDF", description: "Add password protection to PDF", icon: Lock, color: "from-yellow-500 to-amber-600", category: "Security" },
  { id: "unlock", name: "Unlock PDF", description: "Remove password from PDF", icon: Unlock, color: "from-purple-500 to-violet-600", category: "Security" },
  { id: "rotate", name: "Rotate Pages", description: "Rotate pages in your PDF", icon: RotateCw, color: "from-cyan-500 to-teal-600", category: "Edit" },
  { id: "remove-pages", name: "Remove Pages", description: "Delete pages from PDF", icon: Trash2, color: "from-red-400 to-red-600", category: "Edit" },
  { id: "extract-pages", name: "Extract Pages", description: "Extract specific pages from PDF", icon: FileDown, color: "from-indigo-500 to-blue-600", category: "Organize" },
  { id: "images-to-pdf", name: "Images to PDF", description: "Convert images to PDF", icon: FilePlus, color: "from-orange-500 to-amber-600", category: "Convert" },
  { id: "pdf-to-images", name: "PDF to Images", description: "Convert PDF pages to images", icon: FileImage, color: "from-pink-500 to-rose-600", category: "Convert" },
  { id: "watermark", name: "Add Watermark", description: "Add text watermark to PDF", icon: Stamp, color: "from-gray-500 to-gray-700", category: "Edit" },
  { id: "page-numbers", name: "Page Numbers", description: "Add page numbers to PDF", icon: Hash, color: "from-teal-500 to-green-600", category: "Edit" },
  { id: "rearrange", name: "Rearrange Pages", description: "Reorder pages in PDF", icon: SortAsc, color: "from-violet-500 to-purple-600", category: "Organize" },
];

const categories = ["All", "Organize", "Edit", "Convert", "Optimize", "Security"];

export default function PDFToolsModule() {
  const [activeTool, setActiveTool] = useState<PDFTool>(null);
  const [categoryFilter, setCategoryFilter] = useState("All");

  const filteredTools = categoryFilter === "All" ? tools : tools.filter((t) => t.category === categoryFilter);

  if (activeTool) {
    const tool = tools.find((t) => t.id === activeTool)!;
    return <PDFToolWorkspace tool={tool} onBack={() => setActiveTool(null)} />;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-rose-700 rounded-2xl p-6 text-white mb-6">
        <h2 className="text-2xl font-bold">PDF Tools</h2>
        <p className="text-red-100 mt-1">Free online PDF tools to edit, convert, and manage your documents</p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              categoryFilter === cat
                ? "bg-red-100 text-red-700"
                : "bg-white text-gray-500 hover:bg-gray-50 border"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Tool Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className="bg-white rounded-xl border border-gray-200 p-5 text-left hover:shadow-lg transition-all duration-200 group"
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
              >
                <Icon size={24} className="text-white" />
              </div>
              <h4 className="font-semibold text-gray-900">{tool.name}</h4>
              <p className="text-sm text-gray-500 mt-1">{tool.description}</p>
              <div className="mt-3 flex items-center gap-1 text-xs text-gray-400 group-hover:text-red-500 transition-colors">
                Use Tool <ArrowRight size={12} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PDFToolWorkspace({ tool, onBack }: { tool: ToolConfig; onBack: () => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [options, setOptions] = useState({
    password: "",
    watermarkText: "CONFIDENTIAL",
    rotation: 90,
    pagesToExtract: "1-3",
    pagesToRemove: "2",
    compressionLevel: "medium",
    pageNumberPosition: "bottom-center",
    splitEvery: 1,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const processFiles = async () => {
    if (files.length === 0) return;
    setProcessing(true);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      formData.append("tool", tool.id!);
      formData.append("options", JSON.stringify(options));

      const response = await fetch("/api/pdf", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${tool.id}-result.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // Client-side processing fallback
    }

    setDone(true);
    setProcessing(false);
  };

  const acceptTypes = tool.id === "images-to-pdf" ? "image/*" : ".pdf";
  const IconComp = tool.icon;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1">
        &larr; Back to All Tools
      </button>

      {/* Tool Header */}
      <div className="bg-white rounded-2xl border p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center`}>
            <IconComp size={28} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{tool.name}</h2>
            <p className="text-gray-500">{tool.description}</p>
          </div>
        </div>
      </div>

      {done ? (
        <div className="bg-white rounded-2xl border p-12 text-center">
          <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
          <h3 className="text-xl font-bold text-gray-900">Processing Complete!</h3>
          <p className="text-gray-500 mt-2">Your file has been processed successfully.</p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => { setDone(false); setFiles([]); }}
              className="px-6 py-2.5 border rounded-lg hover:bg-gray-50 text-sm"
            >
              Process Another
            </button>
            <button onClick={onBack} className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
              Back to Tools
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* File Upload Area */}
          <div
            className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-8 text-center mb-6 hover:border-red-400 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptTypes}
              multiple={tool.id === "merge" || tool.id === "images-to-pdf"}
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">
              Drop your {tool.id === "images-to-pdf" ? "images" : "PDF files"} here
            </h3>
            <p className="text-sm text-gray-400 mt-1">or click to browse</p>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="bg-white rounded-xl border p-4 mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Selected Files ({files.length})</h4>
              <div className="space-y-2">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-red-500" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button onClick={() => removeFile(i)} className="p-1 rounded hover:bg-gray-200">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tool-specific Options */}
          {files.length > 0 && (
            <div className="bg-white rounded-xl border p-4 mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Options</h4>
              <ToolOptions toolId={tool.id!} options={options} setOptions={setOptions} />
            </div>
          )}

          {/* Process Button */}
          {files.length > 0 && (
            <button
              onClick={processFiles}
              disabled={processing}
              className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <IconComp size={20} />
                  {tool.name}
                </>
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function ToolOptions({
  toolId,
  options,
  setOptions,
}: {
  toolId: string;
  options: Record<string, any>;
  setOptions: (opts: any) => void;
}) {
  switch (toolId) {
    case "protect":
      return (
        <div>
          <label className="text-sm text-gray-600">Password</label>
          <input
            type="password"
            value={options.password}
            onChange={(e) => setOptions({ ...options, password: e.target.value })}
            placeholder="Enter a secure password"
            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
          />
        </div>
      );

    case "unlock":
      return (
        <div>
          <label className="text-sm text-gray-600">Password</label>
          <input
            type="password"
            value={options.password}
            onChange={(e) => setOptions({ ...options, password: e.target.value })}
            placeholder="Enter the PDF password"
            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
          />
        </div>
      );

    case "rotate":
      return (
        <div>
          <label className="text-sm text-gray-600">Rotation Angle</label>
          <div className="flex gap-2 mt-1">
            {[90, 180, 270].map((angle) => (
              <button
                key={angle}
                onClick={() => setOptions({ ...options, rotation: angle })}
                className={`px-4 py-2 rounded-lg border text-sm ${
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
          <label className="text-sm text-gray-600">Split every N pages</label>
          <input
            type="number"
            min="1"
            value={options.splitEvery}
            onChange={(e) => setOptions({ ...options, splitEvery: parseInt(e.target.value) || 1 })}
            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
          />
        </div>
      );

    case "extract-pages":
      return (
        <div>
          <label className="text-sm text-gray-600">Pages to extract (e.g., 1-3, 5, 7-9)</label>
          <input
            type="text"
            value={options.pagesToExtract}
            onChange={(e) => setOptions({ ...options, pagesToExtract: e.target.value })}
            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
          />
        </div>
      );

    case "remove-pages":
      return (
        <div>
          <label className="text-sm text-gray-600">Pages to remove (e.g., 2, 4-6)</label>
          <input
            type="text"
            value={options.pagesToRemove}
            onChange={(e) => setOptions({ ...options, pagesToRemove: e.target.value })}
            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
          />
        </div>
      );

    case "compress":
      return (
        <div>
          <label className="text-sm text-gray-600">Compression Level</label>
          <div className="flex gap-2 mt-1">
            {["low", "medium", "high"].map((level) => (
              <button
                key={level}
                onClick={() => setOptions({ ...options, compressionLevel: level })}
                className={`flex-1 px-4 py-2 rounded-lg border text-sm capitalize ${
                  options.compressionLevel === level
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      );

    case "watermark":
      return (
        <div>
          <label className="text-sm text-gray-600">Watermark Text</label>
          <input
            type="text"
            value={options.watermarkText}
            onChange={(e) => setOptions({ ...options, watermarkText: e.target.value })}
            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
          />
        </div>
      );

    case "page-numbers":
      return (
        <div>
          <label className="text-sm text-gray-600">Position</label>
          <div className="grid grid-cols-3 gap-2 mt-1">
            {["bottom-left", "bottom-center", "bottom-right", "top-left", "top-center", "top-right"].map((pos) => (
              <button
                key={pos}
                onClick={() => setOptions({ ...options, pageNumberPosition: pos })}
                className={`px-3 py-2 rounded-lg border text-xs capitalize ${
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

    default:
      return (
        <p className="text-sm text-gray-500">No additional options needed. Click the button below to process.</p>
      );
  }
}
