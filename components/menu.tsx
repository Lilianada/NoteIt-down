"use client"
import { useState, useEffect, useRef } from "react"
import type { Note } from "@/types"
import { useFont } from "@/contexts/font-context"
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import HelpModal from "@/components/help-modal"
import ExportDialog from "@/components/export-dialog"
import { HelpCircle, Download } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useNotes } from "@/contexts/note-context"

interface MenuProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export function Menu({isOpen, setIsOpen }: MenuProps) {
  const { fontType, toggleFont } = useFont();
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const { notes, selectedNoteId } = useNotes();
  const menuRef = useRef<HTMLDivElement>(null);
  
  const currentNote = selectedNoteId ? notes.find(note => note.id === selectedNoteId) : null;
  
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  }
  
  // Handle clicking outside of menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    // Add event listener only when menu is open
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button onClick={toggleMenu} className="p-1 text-gray-500 hover:text-gray-700" aria-label="Menu">
        •••
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10 p-2">
          <div className="py-2 px-4 border-b border-gray-100">
            <p className="text-xs text-gray-500">Font Settings</p>
          </div>
          <div className="p-2">
            <button
              onClick={() => {
                toggleFont();
                // Optional: close menu after selection
                setIsOpen(false);
              }}
              className="flex w-full items-center justify-between px-2 py-1 text-sm rounded hover:bg-gray-50"
            >
              <span>Font Type</span>
              <span className={`px-2 py-0.5 text-xs rounded-md ${
                fontType === 'mono' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {fontType === 'mono' ? 'Mono' : 'Sans'}
              </span>
            </button>
          </div>
          
          <div className="border-t border-gray-100 mt-2 pt-2">
            <div className="py-1 px-4">
              <p className="text-xs text-gray-500">Tools</p>
            </div>
            <div className="p-2">
              <button
                onClick={() => {
                  setIsExportModalOpen(true);
                  setIsOpen(false);
                }}
                className="flex w-full items-center px-2 py-1 text-sm rounded hover:bg-gray-50"
                disabled={notes.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                <span>Export</span>
              </button>
            </div>
          </div>
          
          <div className="border-t border-gray-100 mt-2 pt-2">
            <div className="py-1 px-4">
              <p className="text-xs text-gray-500">Help</p>
            </div>
            <div className="p-2">
              <button
                onClick={() => {
                  setIsHelpModalOpen(true);
                  setIsOpen(false);
                }}
                className="flex w-full items-center px-2 py-1 text-sm rounded hover:bg-gray-50"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                <span>Help</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Help Modal */}
      <HelpModal 
        isOpen={isHelpModalOpen} 
        onClose={() => setIsHelpModalOpen(false)} 
      />
      
      {/* Export Dialog */}
      <ExportDialog
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        currentNote={currentNote}
        allNotes={notes}
      />
    </div>
  )
}
