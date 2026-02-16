import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from '../useActor';
import { MediaAttachment, MediaAttachmentUpload } from '../../backend';
import { uploadFileWithChunking, shouldUseChunkedUpload } from '../../utils/chunkedUpload';

export function useListProgramAttachments(programId: string | undefined, enabled: boolean = true) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<MediaAttachment[]>({
    queryKey: ['programAttachments', programId],
    queryFn: async () => {
      if (!actor || !programId) return [];
      return actor.listProgramMediaAttachments(programId);
    },
    enabled: !!actor && !actorFetching && !!programId && enabled,
  });
}

export function useListProgramDocuments(programId: string | undefined, enabled: boolean = true) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<MediaAttachment[]>({
    queryKey: ['programDocuments', programId],
    queryFn: async () => {
      if (!actor || !programId) return [];
      const allAttachments = await actor.listProgramMediaAttachments(programId);
      return allAttachments.filter(a => !a.isImage && !a.isArchived);
    },
    enabled: !!actor && !actorFetching && !!programId && enabled,
  });
}

export function useListProgramImages(programId: string | undefined, enabled: boolean = true) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<MediaAttachment[]>({
    queryKey: ['programImages', programId],
    queryFn: async () => {
      if (!actor || !programId) return [];
      const allAttachments = await actor.listProgramMediaAttachments(programId);
      return allAttachments.filter(a => a.isImage && !a.isArchived);
    },
    enabled: !!actor && !actorFetching && !!programId && enabled,
  });
}

export function useUploadProgramAttachment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, isImage }: { file: File; isImage: boolean }) => {
      if (!actor) throw new Error('Actor not available');

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
      
      return actor.uploadProgramMediaAttachment(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programAttachments'] });
      queryClient.invalidateQueries({ queryKey: ['programDocuments'] });
      queryClient.invalidateQueries({ queryKey: ['programImages'] });
      queryClient.invalidateQueries({ queryKey: ['programTimeline'] });
    },
  });
}

export function useGetAttachmentBytes() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (attachmentId: string): Promise<Uint8Array> => {
      if (!actor) throw new Error('Actor not available');

      const result = await actor.getProgramMediaAttachmentFile(attachmentId);
      
      if (!result) {
        throw new Error('Attachment file not found or could not be retrieved');
      }

      // Ensure we return a standard Uint8Array
      return new Uint8Array(result);
    },
  });
}

export function useDownloadProgramAttachment() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ attachmentId, filename }: { attachmentId: string; filename: string }) => {
      if (!actor) throw new Error('Actor not available');

      const result = await actor.getProgramMediaAttachmentFile(attachmentId);
      
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

export function useArchiveProgramAttachment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ attachmentId, programId }: { attachmentId: string; programId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteProgramMediaAttachment(attachmentId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['programAttachments', variables.programId] });
      queryClient.invalidateQueries({ queryKey: ['programDocuments', variables.programId] });
      queryClient.invalidateQueries({ queryKey: ['programImages', variables.programId] });
      queryClient.invalidateQueries({ queryKey: ['programTimeline', variables.programId] });
    },
  });
}
