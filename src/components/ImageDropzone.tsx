import React, { useRef, useState } from 'react';

interface ImageDropzoneProps {
  onImageSelected: (file: File) => void;
  isProcessing?: boolean;
  className?: string;
  title?: string;
  subtitle?: string;
}

/**
 * Large tactile drag-and-drop file upload container
 * Matches user's reference design with dashed border, central upload tray icon,
 * hover animations, drag-over highlights, and click-to-upload.
 */
export const ImageDropzone: React.FC<ImageDropzoneProps> = ({
  onImageSelected,
  isProcessing = false,
  className = '',
  title = 'בחר קובץ או גרור לכאן',
  subtitle = 'Choose a file or drag it here • JPG, PNG, WebP',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onImageSelected(file);
      }
    }
  };

  const handleClick = () => {
    if (!isProcessing) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelected(file);
      // Reset so the same file can be re-selected if desired
      e.target.value = '';
    }
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative w-full rounded-3xl border-2 border-dashed transition-all duration-200 cursor-pointer flex flex-col items-center justify-center p-8 sm:p-12 text-center select-none group ${
        isDragOver
          ? 'border-indigo-400 bg-indigo-950/60 scale-[1.01] shadow-xl shadow-indigo-500/20'
          : 'border-slate-400/50 hover:border-indigo-400/80 bg-slate-900/60 hover:bg-slate-900/90'
      } ${className}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={isProcessing}
        onChange={handleFileChange}
      />

      {/* Central Upload/Download Tray Icon exactly inspired by reference */}
      <div
        className={`w-16 h-16 sm:w-20 sm:h-20 mb-4 flex items-center justify-center rounded-2xl transition-all duration-300 ${
          isDragOver
            ? 'scale-110 text-indigo-400 bg-indigo-500/20'
            : 'text-slate-400 group-hover:text-indigo-300 group-hover:scale-105 bg-slate-800/60'
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-10 h-10 sm:w-12 sm:h-12"
        >
          {/* Tray base */}
          <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
          {/* Arrow pointing down or up into tray */}
          <polyline points="7 11 12 16 17 11" />
          <line x1="12" y1="4" x2="12" y2="16" />
        </svg>
      </div>

      {/* Primary Call to Action */}
      <h4
        className={`text-base sm:text-lg font-black tracking-wide transition-colors ${
          isDragOver ? 'text-indigo-300' : 'text-slate-200 group-hover:text-white'
        }`}
      >
        {isProcessing
          ? 'דוחס ומכין את קובץ התמונה...'
          : isDragOver
          ? 'שחרר את התמונה כאן להעלאה!'
          : title}
      </h4>

      {/* Secondary Subtitle */}
      <p className="text-xs sm:text-sm text-slate-400 mt-1.5 font-medium transition-colors group-hover:text-slate-300">
        {isProcessing ? 'אנא המתן מספר רגעים' : subtitle}
      </p>

      {/* Subtle indicator hint */}
      <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300 group-hover:border-indigo-500/40 transition-colors">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>לחיצה לבחירה מהמכשיר או גרירה ישירה למסך</span>
      </div>
    </div>
  );
};
