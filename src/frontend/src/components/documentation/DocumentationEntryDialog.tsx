import { useState, useEffect } from 'react';
import { useCreateDocumentationEntry } from '../../hooks/data/useDocumentation';
import { useActivities } from '../../hooks/data/useActivities';
import { useGetCallerUserProfile } from '../../hooks/queries/useCurrentUser';
import { useIsCallerAdmin } from '../../hooks/queries/useCurrentUser';
import { useListDocumentationAttachments, useDownloadDocumentationAttachment, useGetDocumentationAttachmentBytes, useArchiveDocumentationAttachment, useUploadDocumentationAttachment } from '../../hooks/data/useDocumentationAttachments';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import ImagePreviewDialog from '../common/ImagePreviewDialog';
import { DocumentationEntry } from '../../backend';
import { showSuccessToast, showErrorToast, SUCCESS_MESSAGES, humanizeError } from '../../utils/mutationFeedback';
import { Loader2, Download, Eye, Trash2, FileText, Image as ImageIcon, AlertCircle, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface DocumentationEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: DocumentationEntry | null;
}

// Helper to determine if a file is an image
const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

export default function DocumentationEntryDialog({ open, onOpenChange, entry }: DocumentationEntryDialogProps) {
  const [activityId, setActivityId] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; filename: string; attachmentId: string } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const { data: activities = [] } = useActivities();
  const { data: userProfile } = useGetCallerUserProfile();
  const createEntry = useCreateDocumentationEntry();

  // Fetch admin status for permission checks
  const { data: isAdmin = false } = useIsCallerAdmin();

  // Fetch attachments for existing documentation entries
  const { data: attachments = [], isLoading: attachmentsLoading } = useListDocumentationAttachments(
    entry ? Number(entry.id) : undefined,
    !!entry
  );

  const downloadAttachment = useDownloadDocumentationAttachment();
  const getAttachmentBytes = useGetDocumentationAttachmentBytes();
  const archiveAttachment = useArchiveDocumentationAttachment();
  const uploadAttachment = useUploadDocumentationAttachment();

  const isEditing = !!entry;

  // Find the related activity to get programId
  const relatedActivity = activities.find(a => a.id === (entry?.activityId || activityId));

  useEffect(() => {
    if (entry) {
      setActivityId(entry.activityId);
      setContent(entry.content);
    } else {
      setActivityId('');
      setContent('');
    }
    setSelectedFile(null);
  }, [entry, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Guard against double-submit
    if (isSubmitting) return;
    
    if (!activityId) {
      showErrorToast(new Error('Validation'), 'Please select an activity');
      return;
    }

    if (!content.trim()) {
      showErrorToast(new Error('Validation'), 'Please enter content');
      return;
    }

    setIsSubmitting(true);
    try {
      if (!isEditing) {
        await createEntry.mutateAsync({
          activityId,
          content: content.trim(),
          author: userProfile?.name || 'Unknown',
          timestamp: BigInt(Date.now()),
          isActive: true,
          isArchived: false,
        });
        showSuccessToast(SUCCESS_MESSAGES.documentationCreated);
      }
      onOpenChange(false);
    } catch (error: unknown) {
      showErrorToast(error, 'Failed to create documentation entry');
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
    if (!selectedFile || !entry || !relatedActivity) return;

    try {
      await uploadAttachment.mutateAsync({
        file: selectedFile,
        documentationId: Number(entry.id),
        programId: relatedActivity.programId,
        isImage: isImageFile(selectedFile),
      });
      toast.success('Attachment uploaded successfully');
      setSelectedFile(null);
      // Reset file input
      const fileInput = document.getElementById('documentation-file-input') as HTMLInputElement;
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
    if (!entry || !relatedActivity) return;
    
    try {
      await archiveAttachment.mutateAsync({
        attachmentId,
        documentationId: Number(entry.id),
        programId: relatedActivity.programId,
      });
      toast.success('Attachment removed successfully');
    } catch (error) {
      toast.error(humanizeError(error));
    }
  };

  const isPending = createEntry.isPending || isSubmitting;

  // Permission check: admin can remove attachments
  const canRemoveAttachments = isAdmin;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Documentation Entry' : 'Create Documentation Entry'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'View documentation entry details' : 'Add notes, reflections, or outcomes from an activity'}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
            <div className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="activity">Activity *</Label>
                  <Select value={activityId} onValueChange={setActivityId} disabled={isEditing}>
                    <SelectTrigger id="activity">
                      <SelectValue placeholder="Select an activity" />
                    </SelectTrigger>
                    <SelectContent>
                      {activities.map((activity) => (
                        <SelectItem key={activity.id} value={activity.id}>
                          {activity.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    placeholder="Enter your notes, reflections, or outcomes here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={isEditing}
                    rows={8}
                    className="resize-none"
                  />
                </div>
                {isEditing && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Author: {entry?.author}</p>
                    <p>Created: {new Date(Number(entry?.timestamp)).toLocaleString()}</p>
                  </div>
                )}
              </form>

              {isEditing && entry && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Attachments</h3>
                    
                    {/* Upload Section */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          id="documentation-file-input"
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
                    Attachments can be added after the documentation entry is created.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {isEditing ? 'Close' : 'Cancel'}
            </Button>
            {!isEditing && (
              <Button 
                type="submit" 
                onClick={handleSubmit}
                disabled={isPending}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? 'Creating...' : 'Create Entry'}
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
