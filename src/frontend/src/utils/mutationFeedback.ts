import { toast } from 'sonner';
import { ChunkedUploadError } from './chunkedUpload';

/**
 * Shared mutation feedback utilities for consistent success/error messaging
 * across all mutation operations in the application.
 */

/**
 * Display a success toast with consistent styling
 */
export function showSuccessToast(message: string) {
  toast.success(message);
}

/**
 * Humanize error messages for end users while preserving technical details for debugging
 */
export function humanizeError(error: unknown): string {
  // Log full error for debugging
  console.error('Mutation error:', error);

  // Handle ChunkedUploadError specifically
  if (error instanceof ChunkedUploadError) {
    switch (error.code) {
      case 'SIZE_LIMIT':
        return 'This file is too large to upload in a single request. The Internet Computer has a ~2MB limit per request. Please try a smaller file or contact support if you need to upload larger files.';
      case 'CHUNK_FAILED':
        return 'Upload failed while sending file data. Please try again or use a smaller file.';
      case 'FINALIZE_FAILED':
        return 'Upload could not be completed. Please try again.';
      case 'NETWORK':
        return 'Network error during upload. Please check your connection and try again.';
      default:
        return 'Failed to upload file. Please try again or use a smaller file.';
    }
  }

  // Extract error message
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Map common error patterns to user-friendly messages
  if (errorMessage.includes('Unauthorized') || errorMessage.includes('permission')) {
    return 'You do not have permission to perform this action.';
  }

  if (errorMessage.includes('not found') || errorMessage.includes('does not exist') || errorMessage.includes('could not be retrieved')) {
    return 'The requested item could not be found.';
  }

  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }

  if (errorMessage.includes('Actor not available') || errorMessage.includes('agent')) {
    return 'Service temporarily unavailable. Please try again in a moment.';
  }

  if (errorMessage.includes('not yet implemented')) {
    return 'This feature is not yet available.';
  }

  if (errorMessage.includes('File size exceeds')) {
    return errorMessage; // Pass through file size errors as-is
  }

  // Enhanced trap/canister error handling for upload-related issues
  if (errorMessage.includes('trap') || errorMessage.includes('Canister')) {
    // Check if it's likely a size-related trap
    if (errorMessage.toLowerCase().includes('payload') || 
        errorMessage.toLowerCase().includes('message') ||
        errorMessage.toLowerCase().includes('ingress')) {
      return 'File is too large for a single upload request. The Internet Computer has a ~2MB request limit. Please try a smaller file.';
    }
    return 'An error occurred while processing your request. Please try again.';
  }

  // Attachment-specific errors
  if (errorMessage.toLowerCase().includes('attachment') || errorMessage.includes('Failed to upload file')) {
    return 'Failed to upload attachment. The file may be too large or there was a network issue. Please try again with a smaller file.';
  }

  // Upload-specific errors with more context
  if (errorMessage.toLowerCase().includes('upload')) {
    return 'Upload failed. This may be due to file size (IC has a ~2MB request limit), network issues, or server problems. Please try a smaller file or check your connection.';
  }

  // Generic fallback for unknown errors
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Display an error toast with humanized message
 */
export function showErrorToast(error: unknown, fallbackMessage?: string) {
  const humanMessage = humanizeError(error);
  toast.error(fallbackMessage || humanMessage);
}

/**
 * Standard success messages for common operations
 */
export const SUCCESS_MESSAGES = {
  // Activities
  activityCreated: 'Activity created successfully',
  activityUpdated: 'Activity updated successfully',
  activityArchived: 'Activity archived successfully',
  
  // Documentation
  documentationCreated: 'Documentation entry created successfully',
  documentationArchived: 'Documentation entry archived successfully',
  
  // Schedule Events
  eventCreated: 'Event created successfully',
  eventArchived: 'Event removed successfully',
} as const;
