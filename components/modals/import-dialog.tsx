"use client";

import React, { useState, useRef } from 'react';
import { FileUp, FileText, FilePlus, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { importFiles, ImportResult } from '@/lib/data-processing/import-utils';
import { useAppState } from '@/lib/state/app-state';
import {
  UltraTransparentDialog,
  UltraTransparentDialogContent,
  UltraTransparentDialogHeader,
  UltraTransparentDialogTitle,
} from '@/components/ui/ultra-transparent-dialog';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportDialog({ isOpen, onClose }: ImportDialogProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { addNote } = useAppState();

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);
    }
  };

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      setSelectedFiles(filesArray);
    }
  };

  // Trigger file input click
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Clear selected files
  const handleClearFiles = () => {
    setSelectedFiles([]);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Import the selected files
  const handleImport = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to import.",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const result = await importFiles(selectedFiles);
      setImportResult(result);

      if (result.success) {
        // Add imported notes to the app
        for (const note of result.notes) {
          // Type fix: Pass note properties instead of the note object
          await addNote(note.noteTitle || 'Imported Note');
        }

        toast({
          title: "Import successful",
          description: `Successfully imported ${result.notes.length} note${result.notes.length !== 1 ? 's' : ''}.`,
        });

        // Close dialog after successful import
        setTimeout(() => {
          onClose();
          handleClearFiles();
        }, 2000);
      } else {
        toast({
          title: "Import failed",
          description: "Failed to import files. See details in the dialog.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import error",
        description: `An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <UltraTransparentDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <UltraTransparentDialogContent className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full overflow-hidden">
        <UltraTransparentDialogHeader>
          <UltraTransparentDialogTitle className="text-lg font-semibold">
            Import Notes
          </UltraTransparentDialogTitle>
        </UltraTransparentDialogHeader>
        
        <div className="p-4">
          <div
            className={`border-2 border-dashed rounded-md p-6 text-center ${
              dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'
            }`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center">
              <FileUp size={32} className="text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                Drag and drop files here, or click to select
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Supports .md, .txt, .pdf, .doc, .docx
              </p>
              <button
                type="button"
                onClick={handleButtonClick}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Select Files
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".md,.txt,.pdf,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {selectedFiles.length > 0 && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium">Selected Files ({selectedFiles.length})</h3>
                <button
                  type="button"
                  onClick={handleClearFiles}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400"
                >
                  Clear all
                </button>
              </div>
              <div className="max-h-40 overflow-y-auto border rounded-md">
                {selectedFiles.map((file, index) => (
                  <div 
                    key={index} 
                    className="flex items-center p-2 text-sm border-b last:border-b-0"
                  >
                    <FileText size={16} className="mr-2 text-gray-500" />
                    <div className="truncate">{file.name}</div>
                    <div className="ml-auto text-xs text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {importResult && (
            <div className="mt-4">
              {importResult.warnings.length > 0 && (
                <div className="mb-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-md text-xs">
                  <p className="font-medium">Warnings:</p>
                  <ul className="list-disc ml-4 mt-1">
                    {importResult.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {importResult.errors.length > 0 && (
                <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md text-xs">
                  <p className="font-medium">Errors:</p>
                  <ul className="list-disc ml-4 mt-1">
                    {importResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {importResult.success && (
                <div className="mb-2 p-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md text-xs">
                  <p>Successfully imported {importResult.notes.length} note{importResult.notes.length !== 1 ? 's' : ''}.</p>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 mr-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={isImporting || selectedFiles.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isImporting ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <FilePlus size={16} className="mr-2" />
                  Import
                </>
              )}
            </button>
          </div>
        </div>
      </UltraTransparentDialogContent>
    </UltraTransparentDialog>
  );
}

export default ImportDialog;
