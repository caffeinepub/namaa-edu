import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from '../useActor';
import { DocumentationAttachment, MediaAttachmentUpload } from '../../backend';
import { uploadFileWithChunking, shouldUseChunkedUpload } from '../../utils/chunkedUpload';

export function useListDocumentationAttachments(documentationId: number | undefined, enabled: boolean = true) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<DocumentationAttachment[]>({
    queryKey: ['documentationAttachments', documentationId],
    queryFn: async () => {
      if (!actor || documentationId === undefined) return [];
      return actor.listDocumentationAttachments(BigInt(documentationId));
    },
    enabled: !!actor && !actorFetching && documentationId !== undefined && enabled,
  });
}

export function useUploadDocumentationAttachment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, documentationId, programId, isImage }: { file: File; documentationId: number; programId: string; isImage: boolean }) => {
      if (!actor) throw new Error('Actor not available');

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('File size exceeds 10MB limit');
      }

      const attachmentId = `attach-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      // Use chunked upload utility for all files (handles both large and small)
      const payload = await uploadFileWithChunking(
        actor,
        file,
        {
          id: attachmentId,
          filename: file.name,
          contentType: file.type || 'application/octet-stream',
          isImage,
        }
      );
      
      return actor.uploadDocumentationAttachment(BigInt(documentationId), programId, payload);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documentationAttachments', variables.documentationId] });
      queryClient.invalidateQueries({ queryKey: ['programTimeline', variables.programId] });
    },
  });
}

export function useGetDocumentationAttachmentBytes() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (attachmentId: string): Promise<Uint8Array> => {
      if (!actor) throw new Error('Actor not available');

      const result = await actor.getDocumentationAttachmentFile(attachmentId);
      
      if (!result) {
        throw new Error('Attachment file not found or could not be retrieved');
      }

      // Ensure we return a standard Uint8Array
      return new Uint8Array(result);
    },
  });
}

export function useDownloadDocumentationAttachment() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ attachmentId, filename }: { attachmentId: string; filename: string }) => {
      if (!actor) throw new Error('Actor not available');

      const result = await actor.getDocumentationAttachmentFile(attachmentId);
      
      if (!result) {
        throw new Error('Attachment file not found or could not be retrieved');
      }

      // Convert to Uint8Array and create blob
      const bytes = new Uint8Array(result);
      const blob = new Blob([bytes]);
      
      // Create download link and trigger download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
  });
}

export function useArchiveDocumentationAttachment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ attachmentId, documentationId, programId }: { attachmentId: string; documentationId: number; programId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteDocumentationAttachment(attachmentId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documentationAttachments', variables.documentationId] });
      queryClient.invalidateQueries({ queryKey: ['programTimeline', variables.programId] });
    },
  });
}
