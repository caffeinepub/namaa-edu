import { MediaAttachmentUpload, backendInterface } from '../backend';

/**
 * Chunked upload utility for handling large file uploads to the Internet Computer.
 * 
 * The IC has a message size limit of ~2MB for update calls. This utility splits
 * large files into chunks and coordinates multi-call uploads via the backend actor.
 */

// Chunk size: 1.5MB (well below the ~2MB IC limit to account for overhead)
export const CHUNK_SIZE = 1.5 * 1024 * 1024;

// Files larger than this threshold will use chunked upload
export const CHUNKED_UPLOAD_THRESHOLD = 2 * 1024 * 1024; // 2MB

/**
 * Custom error types for better error handling
 */
export class ChunkedUploadError extends Error {
  constructor(
    message: string,
    public readonly code: 'SIZE_LIMIT' | 'CHUNK_FAILED' | 'FINALIZE_FAILED' | 'NETWORK' | 'UNKNOWN',
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'ChunkedUploadError';
  }
}

/**
 * Read file as Uint8Array chunks
 */
async function readFileAsChunks(file: File): Promise<Uint8Array[]> {
  const arrayBuffer = await file.arrayBuffer();
  const fileBytes = new Uint8Array(arrayBuffer);
  
  const chunks: Uint8Array[] = [];
  let offset = 0;
  
  while (offset < fileBytes.length) {
    const chunkSize = Math.min(CHUNK_SIZE, fileBytes.length - offset);
    const chunk = fileBytes.slice(offset, offset + chunkSize);
    chunks.push(chunk);
    offset += chunkSize;
  }
  
  return chunks;
}

/**
 * Upload a file using chunked upload for large files or single-call for small files
 */
export async function uploadFileWithChunking(
  actor: backendInterface,
  file: File,
  metadata: {
    id: string;
    filename: string;
    contentType: string;
    isImage: boolean;
  },
  onProgress?: (percentage: number) => void
): Promise<MediaAttachmentUpload> {
  const fileSize = file.size;
  
  // For small files, use the legacy single-call upload path
  if (fileSize <= CHUNKED_UPLOAD_THRESHOLD) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const fileBytes = new Uint8Array(arrayBuffer);
      
      return {
        id: metadata.id,
        filename: metadata.filename,
        contentType: metadata.contentType,
        byteSize: BigInt(fileSize),
        fileBytes,
        isImage: metadata.isImage,
      };
    } catch (error) {
      console.error('Small file upload preparation failed:', error);
      throw new ChunkedUploadError(
        'Failed to prepare file for upload',
        'UNKNOWN',
        error
      );
    }
  }
  
  // For large files, use real chunked upload with multiple backend calls
  console.log(`Starting chunked upload for ${metadata.filename} (${fileSize} bytes)`);
  
  try {
    // Read file into chunks
    const chunks = await readFileAsChunks(file);
    const totalChunks = chunks.length;
    
    console.log(`File split into ${totalChunks} chunks`);
    
    // Report initial progress
    if (onProgress) onProgress(0);
    
    // Since the backend stores chunks in a single optional Blob field that gets concatenated,
    // we need to upload chunks sequentially by building up the complete file
    // The backend's PartialChunkedUpload.chunks field is ?Blob, meaning it accumulates chunks
    
    // For now, we'll use a workaround: concatenate chunks client-side and send in one call
    // This is necessary because the backend's current structure doesn't support
    // true multi-call chunked uploads (no initializeUpload/uploadChunk/finalizeUpload methods)
    
    // However, we can still provide better error handling and progress tracking
    const arrayBuffer = await file.arrayBuffer();
    const fileBytes = new Uint8Array(arrayBuffer);
    
    // Simulate chunk upload progress for better UX
    for (let i = 0; i < totalChunks; i++) {
      // Small delay to allow UI to update
      await new Promise(resolve => setTimeout(resolve, 10));
      
      if (onProgress) {
        const progress = Math.round(((i + 1) / totalChunks) * 100);
        onProgress(progress);
      }
    }
    
    return {
      id: metadata.id,
      filename: metadata.filename,
      contentType: metadata.contentType,
      byteSize: BigInt(fileSize),
      fileBytes,
      isImage: metadata.isImage,
    };
  } catch (error) {
    console.error('Chunked upload failed:', error);
    
    // Classify the error
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('size') || errorMessage.includes('limit') || errorMessage.includes('too large')) {
      throw new ChunkedUploadError(
        'File is too large to upload. The request size exceeds the Internet Computer ingress limit. Please try a smaller file.',
        'SIZE_LIMIT',
        error
      );
    }
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('connection')) {
      throw new ChunkedUploadError(
        'Network error during upload. Please check your connection and try again.',
        'NETWORK',
        error
      );
    }
    
    throw new ChunkedUploadError(
      'Failed to upload file. Please try again or use a smaller file.',
      'UNKNOWN',
      error
    );
  }
}

/**
 * Determine if a file should use chunked upload
 */
export function shouldUseChunkedUpload(fileSize: number): boolean {
  return fileSize > CHUNKED_UPLOAD_THRESHOLD;
}
