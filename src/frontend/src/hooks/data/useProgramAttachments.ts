import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from '../useActor';
import { ProgramMediaAttachment, MediaAttachmentUpload } from '../../backend';

export function useListProgramAttachments(programId: string | undefined, enabled: boolean = true) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<ProgramMediaAttachment[]>({
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

  return useQuery<ProgramMediaAttachment[]>({
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

  return useQuery<ProgramMediaAttachment[]>({
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
    mutationFn: async ({ file, programId, isImage }: { file: File; programId: string; isImage: boolean }) => {
      if (!actor) throw new Error('Actor not available');

      // Read file as Uint8Array
      const arrayBuffer = await file.arrayBuffer();
      const fileBytes = new Uint8Array(arrayBuffer);

      const payload: MediaAttachmentUpload = {
        id: `attach-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        programId,
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        byteSize: BigInt(file.size),
        fileBytes,
        isImage,
      };

      return actor.uploadProgramMediaAttachment(payload);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['programAttachments', variables.programId] });
      queryClient.invalidateQueries({ queryKey: ['programDocuments', variables.programId] });
      queryClient.invalidateQueries({ queryKey: ['programImages', variables.programId] });
    },
  });
}

export function useDownloadProgramAttachment() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ attachmentId, filename }: { attachmentId: string; filename: string }) => {
      if (!actor) throw new Error('Actor not available');

      // Note: Backend doesn't have downloadProgramAttachment method
      // This functionality would need to be implemented in the backend
      throw new Error('Download functionality not yet implemented in backend');
    },
  });
}

export function useGetAttachmentBytes() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (attachmentId: string): Promise<Uint8Array> => {
      if (!actor) throw new Error('Actor not available');

      // Note: Backend doesn't have downloadProgramAttachment method
      // This functionality would need to be implemented in the backend
      throw new Error('Download functionality not yet implemented in backend');
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
    },
  });
}
