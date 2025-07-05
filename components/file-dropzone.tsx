'use client';

import { useCallback, useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
}

export function FileDropzone({ onFileSelect }: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  return (
    <Card className={`
      p-12 border-2 border-dashed transition-all duration-300 cursor-pointer bg-card/50
      ${isDragging 
        ? 'border-primary bg-primary/5 scale-105' 
        : 'border-border/50 hover:border-primary/50 hover:bg-accent/50'
      }
    `}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="text-center space-y-4"
      >
        <div className={`
          w-16 h-16 mx-auto rounded-full flex items-center justify-center transition-all duration-300
          ${isDragging ? 'bg-primary text-primary-foreground scale-110' : 'bg-muted'}
        `}>
          <Upload className="h-8 w-8" />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2">
            {isDragging ? 'Drop your file here' : 'Drag & drop your file'}
          </h3>
          <p className="text-muted-foreground mb-4">
            or click to browse (max 700MB)
          </p>
        </div>
        
        <div>
          <input
            type="file"
            onChange={handleFileInput}
            className="hidden"
            id="file-input"
            accept="*/*"
          />
          <Button asChild variant="outline" className="hover:scale-105 transition-transform">
            <label htmlFor="file-input" className="cursor-pointer">
              <FileText className="h-4 w-4 mr-2" />
              Choose File
            </label>
          </Button>
        </div>
      </div>
    </Card>
  );
}