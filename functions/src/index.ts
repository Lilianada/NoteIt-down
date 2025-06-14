/**
 * Firebase Functions for NoteIt-down application
 * This is a minimal implementation that avoids unnecessary complexity.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

// Initialize Firebase Admin SDK
admin.initializeApp();

// Example of a simple hello world function (comment out when not needed)
export const helloWorld = functions.https.onRequest((request, response) => {
  logger.info("Hello world function executed", {structuredData: true});
  response.send("Hello from NoteIt-down!");
});

/**
 * Protect createdAt Timestamp in user notes subcollections
 * 
 * This function prevents the createdAt field from being modified during updates
 * by automatically restoring the original value if it's changed.
 */
export const protectUserNotesCreatedAt = functions.firestore
  .document('users/{userId}/notes/{noteId}')
  .onUpdate((change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    
    logger.info(`Checking update for user ${context.params.userId}, note ${context.params.noteId}`);
    
    // Check if createdAt exists in both documents
    if (beforeData.createdAt && afterData.createdAt) {
      // Compare the timestamps - if they're different, restore original
      if (!beforeData.createdAt.isEqual(afterData.createdAt)) {
        logger.warn(`createdAt was modified for user ${context.params.userId}, note ${context.params.noteId} - restoring original value`);
        
        // Restore the original createdAt value
        return change.after.ref.update({
          createdAt: beforeData.createdAt
        });
      }
    }
    
    return null; // No changes needed
  });
