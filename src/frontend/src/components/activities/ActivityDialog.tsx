import { useState, useEffect } from 'react';
import { useCreateActivity, useUpdateActivityStatus } from '../../hooks/data/useActivities';
import { usePrograms } from '../../hooks/data/usePrograms';
import { useOrphanages } from '../../hooks/data/useOrphanages';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useGetUserProfile } from '../../hooks/queries/useUserProfiles';
import { useIsCallerAdmin } from '../../hooks/queries/useCurrentUser';
import { useListActivityAttachments, useDownloadActivityAttachment, useGetActivityAttachmentBytes, useArchiveActivityAttachment, useUploadActivityAttachment } from '../../hooks/data/useActivityAttachments';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import OwnerIndicator from '../common/OwnerIndicator';
import ImagePreviewDialog from '../common/ImagePreviewDialog';
import { Activity } from '../../backend';
import { ALL_STATUS_OPTIONS } from '../../constants/activityStatuses';
import { showSuccessToast, showErrorToast, SUCCESS_MESSAGES, humanizeError } from '../../utils/mutationFeedback';
import { AlertCircle, Loader2, Download, Eye, Trash2, FileText, Image as ImageIcon, Upload } from 'lucide-react';
import { Principal } from '@dfinity/principal';
import { toast } from 'sonner';

interface ActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity?: Activity | null;
}

const ORPHANAGE_NONE_SENTINEL = 'NONE';

// Helper to determine if a file is an image
const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

export default function ActivityDialog({ open, onOpenChange, activity }: ActivityDialogProps) {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<string>(ALL_STATUS_OPTIONS[0]);
  const [programId, setProgramId] = useState('');
  const [orphanageId, setOrphanageId] = useState<string>(ORPHANAGE_NONE_SENTINEL);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; filename: string; attachmentId: string } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const { identity } = useInternetIdentity();
  const { data: programs = [], isLoading: programsLoading } = usePrograms();
  const { data: orphanages = [] } = useOrphanages();
  const createActivity = useCreateActivity();
  const updateStatus = useUpdateActivityStatus();

  // Fetch owner profile for edit/view mode
  const { data: ownerProfile } = useGetUserProfile(activity?.owner);

  // Fetch admin status for permission checks
  const { data: isAdmin = false } = useIsCallerAdmin();

  // Fetch attachments for existing activities
  const { data: attachments = [], isLoading: attachmentsLoading } = useListActivityAttachments(
    activity?.id,
    !!activity && !activity.id.startsWith('sample-')
  );

  const downloadAttachment = useDownloadActivityAttachment();
  const getAttachmentBytes = useGetActivityAttachmentBytes();
  const archiveAttachment = useArchiveActivityAttachment();
  const uploadAttachment = useUploadActivityAttachment();

  const isEditing = !!activity;
  const isAuthenticated = !!identity;
  const isSampleActivity = activity?.id.startsWith('sample-');
  const showAttachments = isEditing && !isSampleActivity;

  useEffect(() => {
    if (activity) {
      setTitle(activity.title);
      setStatus(activity.status);
      setProgramId(activity.programId);
      setOrphanageId(activity.orphanageId || ORPHANAGE_NONE_SENTINEL);
    } else {
      setTitle('');
      setStatus(ALL_STATUS_OPTIONS[0]);
      setProgramId('');
      setOrphanageId(ORPHANAGE_NONE_SENTINEL);
    }
    setSelectedFile(null);
  }, [activity, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Guard against double-submit
    if (isSubmitting) return;
    
    if (!isAuthenticated) {
      showErrorToast(new Error('Unauthorized'), 'You must be logged in to create activities');
      return;
    }

    if (!title.trim()) {
      showErrorToast(new Error('Validation'), 'Please enter an activity title');
      return;
    }

    if (!programId) {
      showErrorToast(new Error('Validation'), 'Please select a program');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        if (status !== activity.status) {
          await updateStatus.mutateAsync({
            activityId: activity.id,
            newStatus: status,
            activity,
          });
          showSuccessToast(SUCCESS_MESSAGES.activityUpdated);
        }
      } else {
        const finalOrphanageId = orphanageId === ORPHANAGE_NONE_SENTINEL ? undefined : orphanageId;
        const ownerPrincipal = identity!.getPrincipal();
        
        await createActivity.mutateAsync({
          id: `act-${Date.now()}`,
          title: title.trim(),
          status,
          programId,
          orphanageId: finalOrphanageId,
          isArchived: false,
          owner: ownerPrincipal,
        });
        showSuccessToast(SUCCESS_MESSAGES.activityCreated);
      }
      onOpenChange(false);
    } catch (error: unknown) {
      showErrorToast(error, isEditing ? 'Failed to update activity' : 'Failed to create activity');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !activity) return;

    try {
      await uploadAttachment.mutateAsync({
        file: selectedFile,
        activityId: activity.id,
        programId: activity.programId,
        isImage: isImageFile(selectedFile),
      });
      toast.success('Attachment uploaded successfully');
      setSelectedFile(null);
      // Reset file input
      const fileInput = document.getElementById('activity-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      toast.error(humanizeError(error));
    }
  };

  const handleDownload = async (attachmentId: string, filename: string) => {
    try {
      await downloadAttachment.mutateAsync({ attachmentId, filename });
      toast.success(`Downloaded ${filename}`);
    } catch (error) {
      toast.error(humanizeError(error));
    }
  };

  const handlePreview = async (attachmentId: string, filename: string, contentType: string) => {
    try {
      const bytes = await getAttachmentBytes.mutateAsync(attachmentId);
      // Convert to plain array to avoid SharedArrayBuffer type issues
      const byteArray = Array.from(bytes);
      const blob = new Blob([new Uint8Array(byteArray)], { type: contentType });
      const url = URL.createObjectURL(blob);
      setPreviewImage({ url, filename, attachmentId });
    } catch (error) {
      toast.error(humanizeError(error));
    }
  };

  const handleClosePreview = () => {
    if (previewImage) {
      URL.revokeObjectURL(previewImage.url);
      setPreviewImage(null);
    }
  };

  const handleArchive = async (attachmentId: string) => {
    if (!activity) return;
    
    try {
      await archiveAttachment.mutateAsync({
        attachmentId,
        activityId: activity.id,
        programId: activity.programId,
      });
      toast.success('Attachment removed successfully');
    } catch (error) {
      toast.error(humanizeError(error));
    }
  };

  const selectedOrphanage = orphanages.find(o => o.id === (activity?.orphanageId || (orphanageId !== ORPHANAGE_NONE_SENTINEL ? orphanageId : undefined)));
  const isPending = createActivity.isPending || updateStatus.isPending || isSubmitting;
  const canSubmit = isAuthenticated && !isPending;

  // Permission check: admin can remove attachments
  const canRemoveAttachments = isAdmin;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Activity Details' : 'Create New Activity'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'View and update activity information' : 'Add a new activity to track your program execution'}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
            <div className="space-y-4">
              {isEditing && activity && (
                <>
                  <div className="flex items-center gap-2 py-2">
                    <span className="text-sm text-muted-foreground">Owner:</span>
                    <OwnerIndicator 
                      owner={activity.owner} 
                      profile={ownerProfile}
                      size="sm"
                    />
                  </div>
                  <Separator />
                </>
              )}

              {!isAuthenticated && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You must be logged in to create activities.
                  </AlertDescription>
                </Alert>
              )}

              {isAuthenticated && !isEditing && programs.length === 0 && !programsLoading && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No programs available. Please create a program first before adding activities.
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Activity Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Ramadan Micro Camp at Panti Asuhan Al-Ikhlas"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isSampleActivity}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="program">Program *</Label>
                  {programsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading programs...
                    </div>
                  ) : (
                    <Select value={programId} onValueChange={setProgramId} disabled={isEditing || programs.length === 0}>
                      <SelectTrigger id="program">
                        <SelectValue placeholder={programs.length === 0 ? "No programs available" : "Select a program"} />
                      </SelectTrigger>
                      <SelectContent>
                        {programs.map((program) => (
                          <SelectItem key={program.id} value={program.id}>
                            {program.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orphanage">Orphanage Partner</Label>
                  <Select value={orphanageId} onValueChange={setOrphanageId} disabled={isEditing}>
                    <SelectTrigger id="orphanage">
                      <SelectValue placeholder="Select an orphanage (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ORPHANAGE_NONE_SENTINEL}>None</SelectItem>
                      {orphanages.map((orphanage) => (
                        <SelectItem key={orphanage.id} value={orphanage.id}>
                          {orphanage.name} - {orphanage.region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isEditing && selectedOrphanage && (
                    <p className="text-xs text-muted-foreground">
                      Partner: {selectedOrphanage.name}, {selectedOrphanage.region}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select value={status} onValueChange={setStatus} disabled={isSampleActivity}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Activity workflow: Backlog → Planning → Scheduled → In Progress → Completed
                  </p>
                </div>
              </form>

              {showAttachments && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Attachments</h3>
                    
                    {/* Upload Section */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          id="activity-file-input"
                          type="file"
                          onChange={handleFileSelect}
                          disabled={uploadAttachment.isPending}
                          className="flex-1"
                          accept="image/*,.pdf,.doc,.docx,.txt"
                        />
                        <Button
                          type="button"
                          onClick={handleUpload}
                          disabled={!selectedFile || uploadAttachment.isPending}
                          size="sm"
                        >
                          {uploadAttachment.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {selectedFile && (
                        <p className="text-xs text-muted-foreground">
                          Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Supported: Images, PDFs, documents (max 10MB)
                      </p>
                    </div>

                    <Separator />

                    {/* Attachments List */}
                    {attachmentsLoading ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading attachments...
                      </div>
                    ) : attachments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No attachments yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {attachments.map((attachment) => (
                          <div
                            key={attachment.metadata.id}
                            className="flex items-center justify-between gap-2 rounded-lg border p-3"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted">
                                {attachment.metadata.isImage ? (
                                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">
                                  {attachment.metadata.filename}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {(Number(attachment.metadata.byteSize) / 1024).toFixed(1)} KB
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {attachment.metadata.isImage && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handlePreview(attachment.metadata.id, attachment.metadata.filename, attachment.metadata.contentType)}
                                  disabled={getAttachmentBytes.isPending}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(attachment.metadata.id, attachment.metadata.filename)}
                                disabled={downloadAttachment.isPending}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              {canRemoveAttachments && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleArchive(attachment.metadata.id)}
                                  disabled={archiveAttachment.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {!isEditing && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Attachments can be added after the activity is created.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {isEditing ? 'Close' : 'Cancel'}
            </Button>
            {(!isEditing || !isSampleActivity) && (
              <Button 
                type="submit" 
                onClick={handleSubmit}
                disabled={!canSubmit || (programs.length === 0 && !isEditing)}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending
                  ? 'Saving...'
                  : isEditing
                  ? 'Update Status'
                  : 'Create Activity'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {previewImage && (
        <ImagePreviewDialog
          open={!!previewImage}
          onOpenChange={(open) => {
            if (!open) handleClosePreview();
          }}
          imageUrl={previewImage.url}
          filename={previewImage.filename}
          onDownload={() => handleDownload(previewImage.attachmentId, previewImage.filename)}
        />
      )}
    </>
  );
}
