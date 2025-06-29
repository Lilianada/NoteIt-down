import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  serverTimestamp, 
  query, 
  where
} from 'firebase/firestore';
import { db } from './firebase';
import { Note, NoteCategory, NoteEditHistory } from '@/types';
import { convertEditHistory } from './firebase-helpers';

/**
 * Recursively remove undefined values from an object to prevent Firebase errors
 */
function sanitizeForFirebase(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirebase(item)).filter(item => item !== undefined);
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {};
    Object.keys(obj).forEach(key => {
      const value = sanitizeForFirebase(obj[key]);
      if (value !== undefined) {
        cleaned[key] = value;
      }
    });
    return cleaned;
  }
  
  return obj;
}

/**
 * Data operations for Firebase notes (categories, tags, metadata, history)
 */
export class FirebaseDataOperations {
  
  /**
   * Update note category
   */
  static async updateNoteCategory(id: number, category: NoteCategory | null, userId?: string, isAdmin: boolean = false): Promise<void> {
    try {
      // For non-admin users, userId is required for subcollection access
      if (!isAdmin && !userId) {
        throw new Error('User ID is required for non-admin users');
      }
      
      // Get the appropriate collection reference
      let notesRef;
      if (isAdmin) {
        notesRef = collection(db, 'notes');
      } else {
        notesRef = collection(db, 'users', userId!, 'notes');
      }
      
      const q = query(notesRef, where("id", "==", id));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error(`Note with ID ${id} not found`);
      }
      
      const docRef = doc(notesRef, snapshot.docs[0].id);
      
      // Get the current document to access its edit history
      const noteDoc = await getDoc(docRef);
      const noteData = noteDoc.data();
      
      // Note: History is managed by EditHistoryService, not added here
      
      if (category) {
        const updateData = { 
          category, 
          updatedAt: serverTimestamp()
        };
        const sanitizedUpdateData = sanitizeForFirebase(updateData);
        sanitizedUpdateData.updatedAt = serverTimestamp();
        await updateDoc(docRef, sanitizedUpdateData);
      } else {
        // Remove category if null
        const updateData = { 
          category: null,
          updatedAt: serverTimestamp()
        };
        const sanitizedUpdateData = sanitizeForFirebase(updateData);
        sanitizedUpdateData.updatedAt = serverTimestamp();
        await updateDoc(docRef, sanitizedUpdateData);
      }
    } catch (error) {
      console.error('Error updating note category:', error);
      throw new Error(`Failed to update note category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Get note edit history
   */
  static async getNoteHistory(id: number, userId?: string, isAdmin: boolean = false): Promise<NoteEditHistory[]> {
    try {
      // For non-admin users, userId is required for subcollection access
      if (!isAdmin && !userId) {
        throw new Error('User ID is required for non-admin users');
      }
      
      // Get the appropriate collection reference
      let notesRef;
      if (isAdmin) {
        notesRef = collection(db, 'notes');
      } else {
        notesRef = collection(db, 'users', userId!, 'notes');
      }
      
      const q = query(notesRef, where("id", "==", id));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error(`Note with ID ${id} not found`);
      }
      
      // Get the note document
      const noteDoc = await getDoc(doc(notesRef, snapshot.docs[0].id));
      const noteData = noteDoc.data();
      
      // If the note has no edit history, return an empty array
      if (!noteData?.editHistory || !Array.isArray(noteData?.editHistory)) {
        return [];
      }
      
      // Convert and return the edit history
      return convertEditHistory(noteData?.editHistory);
    } catch (error) {
      console.error('Error getting note history:', error);
      return [];
    }
  }

  /**
   * Update note tags
   */
  static async updateNoteTags(id: number, tags: string[], userId?: string, isAdmin: boolean = false): Promise<string[]> {
    try {
      // For non-admin users, userId is required for subcollection access
      if (!isAdmin && !userId) {
        throw new Error('User ID is required for non-admin users');
      }
      
      // Get the appropriate collection reference
      let notesRef;
      if (isAdmin) {
        notesRef = collection(db, 'notes');
      } else {
        notesRef = collection(db, 'users', userId!, 'notes');
      }
      
      const q = query(notesRef, where("id", "==", id));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error(`Note with ID ${id} not found`);
      }
      
      const docRef = doc(notesRef, snapshot.docs[0].id);
      
      // Get the current document to access its edit history
      const noteDoc = await getDoc(docRef);
      const noteData = noteDoc.data();
      
      // Note: History is managed by EditHistoryService, not added here
      
      // Ensure tags are properly cleaned
      const cleanTags = Array.isArray(tags) ? 
        [...tags].filter(Boolean).map(tag => tag.trim().toLowerCase()) : [];
      
      const updateData = { 
        tags: cleanTags,
        updatedAt: serverTimestamp()
      };
      const sanitizedUpdateData = sanitizeForFirebase(updateData);
      sanitizedUpdateData.updatedAt = serverTimestamp();
      await updateDoc(docRef, sanitizedUpdateData);
      
      // Return the clean tags array so callers have access to the normalized values
      return cleanTags;
    } catch (error) {
      console.error('Error updating note tags:', error);
      throw new Error(`Failed to update note tags: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update note data with any field changes
   */
  static async updateNoteData(id: number, updatedNote: Partial<Note>, userId?: string, isAdmin: boolean = false): Promise<void> {
    try {
      // For non-admin users, userId is required for subcollection access
      if (!isAdmin && !userId) {
        throw new Error('User ID is required for non-admin users');
      }
      
      // Get the appropriate collection reference
      let notesRef;
      if (isAdmin) {
        notesRef = collection(db, 'notes');
      } else {
        notesRef = collection(db, 'users', userId!, 'notes');
      }
      
      const q = query(notesRef, where("id", "==", id));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error(`Note with ID ${id} not found`);
      }
      
      const docRef = doc(notesRef, snapshot.docs[0].id);
      const currentDoc = await getDoc(docRef);
      const currentData = currentDoc.data();
      
      // Note: History is managed by EditHistoryService, not created here
      
      // Special handling for tags - ensure it's always an array
      const cleanData: Record<string, any> = {};
      
      // Process each field for Firestore
      if (updatedNote.noteTitle !== undefined) cleanData.noteTitle = updatedNote.noteTitle;
      if (updatedNote.content !== undefined) cleanData.content = updatedNote.content;
      if (updatedNote.category !== undefined) cleanData.category = updatedNote.category;
      if (updatedNote.parentId !== undefined) cleanData.parentId = updatedNote.parentId;
      
      // Special handling for tags - make a direct copy
      if (updatedNote.tags !== undefined) {
        cleanData.tags = Array.isArray(updatedNote.tags) ? [...updatedNote.tags] : [];
      }
      
      // Handle linked notes
      if (updatedNote.linkedNoteIds !== undefined) {
        cleanData.linkedNoteIds = Array.isArray(updatedNote.linkedNoteIds) ? 
          [...updatedNote.linkedNoteIds] : [];
      }
      
      // Update the document with new data
      // Note: History is managed by EditHistoryService when provided in updatedNote
      const updatePayload: any = {
        updatedAt: serverTimestamp()
      };
      
      // Only add defined values from cleanData to avoid undefined values in Firestore
      Object.keys(cleanData).forEach(key => {
        const value = cleanData[key];
        if (value !== undefined) {
          updatePayload[key] = value;
        }
      });
      
      // Only add editHistory if it's explicitly provided in the update
      if (updatedNote.editHistory !== undefined) {
        updatePayload.editHistory = updatedNote.editHistory;
      }
      
      // Final sanitization pass to ensure no undefined values slip through
      const sanitizedUpdatePayload = sanitizeForFirebase(updatePayload);
      // Re-add serverTimestamp since it gets processed by sanitization
      sanitizedUpdatePayload.updatedAt = serverTimestamp();
      
      await updateDoc(docRef, sanitizedUpdatePayload);
    } catch (error) {
      console.error('Error updating note data:', error);
      throw new Error(`Failed to update note data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
