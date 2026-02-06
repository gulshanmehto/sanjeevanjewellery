/**
 * Improved upload zone with better UX
 */

import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const UploadZone = ({
  uploadedPreview,
  isDragging,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileSelect,
  onRemove,
}) => {
  if (uploadedPreview) {
    return (
      <div className="relative group">
        <img
          src={uploadedPreview}
          alt="Uploaded jewellery"
          className="w-full h-80 object-contain rounded-2xl bg-gray-50 dark:bg-gray-900 shadow-lg"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
          <Button
            onClick={onRemove}
            variant="destructive"
            size="lg"
            className="gap-2"
          >
            <X className="w-5 h-5" />
            Remove Image
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`
        relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300
        ${
          isDragging
            ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 scale-105'
            : 'border-gray-300 dark:border-gray-600 hover:border-amber-400 dark:hover:border-amber-500'
        }
      `}
    >
      <input
        type="file"
        accept="image/*"
        onChange={(e) => onFileSelect(e.target.files?.[0])}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        id="file-upload"
      />

      <div className="flex flex-col items-center gap-4 pointer-events-none">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          {isDragging ? (
            <ImageIcon className="w-8 h-8 text-amber-600 dark:text-amber-400 animate-bounce" />
          ) : (
            <Upload className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          )}
        </div>

        <div>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {isDragging ? 'Drop your image here' : 'Upload jewellery image'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Drag & drop or click to browse
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
          <span>Supported: JPG, PNG, WEBP</span>
          <span>•</span>
          <span>Max: 10MB</span>
        </div>
      </div>
    </div>
  );
};
