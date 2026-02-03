import { useState, useEffect, useRef } from 'react';
import { useCreateProgram, useUpdateProgram } from '../../hooks/data/usePrograms';
import {
  useListProgramDocuments,
  useListProgramImages,
  useUploadProgramAttachment,
  useDownloadProgramAttachment,
  useArchiveProgramAttachment,
  useGetAttachmentBytes,
} from '../../hooks/data/useProgramAttachments';
import { useIsCallerAdmin } from '../../hooks/queries/useCurrentUser';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Program } from '../../backend';
import { toast } from 'sonner';
import { Upload, Download, Trash2, FileText, AlertCircle, Info, Image as ImageIcon, Eye } from 'lucide-react';
import ProgramImagePreviewDialog from './ProgramImagePreviewDialog';
import ProgramScheduleCalendar from './ProgramScheduleCalendar';

interface ProgramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program?: Program | null;
}

export default function ProgramDialog({ open, onOpenChange, program }: ProgramDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [objectives, setObjectives] = useState('');
  const [targetParticipants, setTargetParticipants] = useState('');
  const [schedule, setSchedule] = useState('');
  const [resources, setResources] = useState('');
  const [evaluationCriteria, setEvaluationCriteria] = useState('');
  const [budget, setBudget] = useState('');
  const [sponsors, setSponsors] = useState('');
  const [regulations, setRegulations] = useState('');
  const [selectedDocumentFile, setSelectedDocumentFile] = useState<File | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [previewImageFilename, setPreviewImageFilename] = useState<string>('');
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [imageThumbnails, setImageThumbnails] = useState<Map<string, string>>(new Map());
  
  const documentFileInputRef = useRef<HTMLInputElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  
  const createProgram = useCreateProgram();
  const updateProgram = useUpdateProgram();
  const uploadAttachment = useUploadProgramAttachment();
  const downloadAttachment = useDownloadProgramAttachment();
  const archiveAttachment = useArchiveProgramAttachment();
  const getAttachmentBytes = useGetAttachmentBytes();
  
  const { data: isAdmin } = useIsCallerAdmin();

  const isEditing = !!program;
  const isSampleData = program?.id.startsWith('sample-');
  const isRealExistingProgram = isEditing && !isSampleData;

  const { data: documents = [], isLoading: documentsLoading } = useListProgramDocuments(
    program?.id,
    isRealExistingProgram
  );

  const { data: images = [], isLoading: imagesLoading } = useListProgramImages(
    program?.id,
    isRealExistingProgram
  );

  useEffect(() => {
    if (program) {
      setName(program.name);
      setDescription(program.description || '');
      setObjectives(program.objectives || '');
      setTargetParticipants(program.targetParticipants || '');
      setSchedule(program.schedule || '');
      setResources(program.resources || '');
      setEvaluationCriteria(program.evaluationCriteria || '');
      setBudget(program.budget || '');
      setSponsors(program.sponsors || '');
      setRegulations(program.regulations || '');
    } else {
      setName('');
      setDescription('');
      setObjectives('');
      setTargetParticipants('');
      setSchedule('');
      setResources('');
      setEvaluationCriteria('');
      setBudget('');
      setSponsors('');
      setRegulations('');
    }
    setSelectedDocumentFile(null);
    setSelectedImageFile(null);
  }, [program, open]);

  // Load image thumbnails
  useEffect(() => {
    if (images.length > 0) {
      images.forEach(async (image) => {
        if (!imageThumbnails.has(image.id)) {
          try {
            const bytes = await getAttachmentBytes.mutateAsync(image.id);
            // Convert to standard Uint8Array to ensure compatibility
            const standardBytes = new Uint8Array(bytes);
            const blob = new Blob([standardBytes], { type: image.contentType });
            const url = URL.createObjectURL(blob);
            setImageThumbnails((prev) => new Map(prev).set(image.id, url));
          } catch (error) {
            console.error('Failed to load thumbnail:', error);
          }
        }
      });
    }

    return () => {
      imageThumbnails.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [images]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Please enter a program name');
      return;
    }

    const programData: Program = {
      id: isEditing ? program.id : `prog-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      objectives: objectives.trim(),
      targetParticipants: targetParticipants.trim(),
      schedule: schedule.trim(),
      resources: resources.trim(),
      evaluationCriteria: evaluationCriteria.trim(),
      budget: budget.trim(),
      sponsors: sponsors.trim(),
      regulations: regulations.trim(),
      isArchived: isEditing ? program.isArchived : false,
    };

    try {
      if (isEditing) {
        await updateProgram.mutateAsync({ id: program.id, program: programData });
        toast.success('Program updated successfully');
      } else {
        await createProgram.mutateAsync(programData);
        toast.success('Program created successfully');
      }
      onOpenChange(false);
    } catch (error: any) {
      const errorMessage = error?.message || (isEditing ? 'Failed to update program' : 'Failed to create program');
      if (errorMessage.includes('Unauthorized')) {
        toast.error('You do not have permission to perform this action');
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleDocumentFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedDocumentFile(file);
    }
  };

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
    }
  };

  const handleDocumentUpload = async () => {
    if (!selectedDocumentFile || !program) return;

    const maxSize = 10 * 1024 * 1024;
    if (selectedDocumentFile.size > maxSize) {
      toast.error('File is too large. Maximum size is 10MB.');
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ];

    if (!allowedTypes.includes(selectedDocumentFile.type)) {
      toast.error('Invalid file type. Please upload a document file (PDF, Word, Excel, or text file).');
      return;
    }

    try {
      await uploadAttachment.mutateAsync({ file: selectedDocumentFile, programId: program.id, isImage: false });
      toast.success('Document uploaded successfully');
      setSelectedDocumentFile(null);
      if (documentFileInputRef.current) {
        documentFileInputRef.current.value = '';
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to upload document';
      if (errorMessage.includes('Unauthorized')) {
        toast.error('You do not have permission to upload documents');
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleImageUpload = async () => {
    if (!selectedImageFile || !program) return;

    const maxSize = 10 * 1024 * 1024;
    if (selectedImageFile.size > maxSize) {
      toast.error('File is too large. Maximum size is 10MB.');
      return;
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];

    if (!allowedTypes.includes(selectedImageFile.type)) {
      toast.error('Invalid file type. Please upload an image file (PNG, JPEG, GIF, or WebP).');
      return;
    }

    try {
      await uploadAttachment.mutateAsync({ file: selectedImageFile, programId: program.id, isImage: true });
      toast.success('Image uploaded successfully');
      setSelectedImageFile(null);
      if (imageFileInputRef.current) {
        imageFileInputRef.current.value = '';
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to upload image';
      if (errorMessage.includes('Unauthorized')) {
        toast.error('You do not have permission to upload images');
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleDownload = async (attachmentId: string, filename: string) => {
    try {
      await downloadAttachment.mutateAsync({ attachmentId, filename });
      toast.success('Download started');
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to download file';
      toast.error(errorMessage);
    }
  };

  const handleImagePreview = async (attachmentId: string, filename: string) => {
    try {
      const url = imageThumbnails.get(attachmentId);
      if (url) {
        setPreviewImageUrl(url);
        setPreviewImageFilename(filename);
        setShowImagePreview(true);
      }
    } catch (error: any) {
      toast.error('Failed to preview image');
    }
  };

  const handleRemove = async (attachmentId: string) => {
    if (!program) return;

    try {
      await archiveAttachment.mutateAsync({ attachmentId, programId: program.id });
      toast.success('File removed successfully');
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to remove file';
      if (errorMessage.includes('Unauthorized')) {
        toast.error('Only administrators can remove files');
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const formatFileSize = (bytes: bigint): string => {
    const size = Number(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (timestamp: bigint): string => {
    if (timestamp === BigInt(0)) return 'Just now';
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Program' : 'Create New Program'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update the program details below' : 'Add a new educational program with comprehensive planning details'}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-180px)] pr-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Program Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Adab & Fitrah Exploration"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSampleData}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief overview of the program..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  disabled={isSampleData}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="objectives">Objectives</Label>
                <Textarea
                  id="objectives"
                  placeholder="What are the key learning objectives and goals?"
                  value={objectives}
                  onChange={(e) => setObjectives(e.target.value)}
                  rows={3}
                  disabled={isSampleData}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetParticipants">Target Participants</Label>
                <Textarea
                  id="targetParticipants"
                  placeholder="Who is this program designed for? (age range, characteristics, prerequisites)"
                  value={targetParticipants}
                  onChange={(e) => setTargetParticipants(e.target.value)}
                  rows={2}
                  disabled={isSampleData}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="schedule">Schedule & Timeline</Label>
                <Textarea
                  id="schedule"
                  placeholder="Program duration, session frequency, typical schedule..."
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  rows={3}
                  disabled={isSampleData}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resources">Materials & Resources</Label>
                <Textarea
                  id="resources"
                  placeholder="Required materials, equipment, facilities, and resources..."
                  value={resources}
                  onChange={(e) => setResources(e.target.value)}
                  rows={3}
                  disabled={isSampleData}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="budget">Budget & Costs</Label>
                <Textarea
                  id="budget"
                  placeholder="Estimated costs, funding requirements, cost breakdown..."
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  rows={2}
                  disabled={isSampleData}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sponsors">Sponsors & Partners</Label>
                <Textarea
                  id="sponsors"
                  placeholder="Current or potential sponsors, partners, and collaborators..."
                  value={sponsors}
                  onChange={(e) => setSponsors(e.target.value)}
                  rows={2}
                  disabled={isSampleData}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="evaluationCriteria">Evaluation & Success Metrics</Label>
                <Textarea
                  id="evaluationCriteria"
                  placeholder="How will success be measured? What are the key indicators?"
                  value={evaluationCriteria}
                  onChange={(e) => setEvaluationCriteria(e.target.value)}
                  rows={3}
                  disabled={isSampleData}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="regulations">Regulations & Constraints</Label>
                <Textarea
                  id="regulations"
                  placeholder="Any legal requirements, safety protocols, or operational constraints..."
                  value={regulations}
                  onChange={(e) => setRegulations(e.target.value)}
                  rows={2}
                  disabled={isSampleData}
                />
              </div>

              {/* Schedule & Timeline Calendar Section */}
              {isRealExistingProgram && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-semibold">Schedule & Timeline Calendar</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        View and manage program events on the calendar
                      </p>
                    </div>
                    <ProgramScheduleCalendar
                      programId={program.id}
                      isAdmin={isAdmin || false}
                      isSampleData={isSampleData || false}
                    />
                  </div>
                </>
              )}

              {/* Attachments Section */}
              <Separator />
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-semibold">Attachments</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload and manage program-related documents and images
                  </p>
                </div>

                {!isEditing && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Attachments will be available after you create this program.
                    </AlertDescription>
                  </Alert>
                )}

                {isSampleData && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      This is sample data and is read-only. Attachments are not available for sample programs.
                    </AlertDescription>
                  </Alert>
                )}

                {isRealExistingProgram && (
                  <Tabs defaultValue="documents" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="documents">Documents</TabsTrigger>
                      <TabsTrigger value="images">Images</TabsTrigger>
                    </TabsList>

                    <TabsContent value="documents" className="space-y-4">
                      {isAdmin ? (
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <Input
                              ref={documentFileInputRef}
                              type="file"
                              onChange={handleDocumentFileSelect}
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              onClick={handleDocumentUpload}
                              disabled={!selectedDocumentFile || uploadAttachment.isPending}
                              size="sm"
                            >
                              {uploadAttachment.isPending ? (
                                'Uploading...'
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload
                                </>
                              )}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Supported formats: PDF, Word, Excel, Text files. Maximum size: 10MB
                          </p>
                        </div>
                      ) : (
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            Only administrators can upload documents. You can download existing documents below.
                          </AlertDescription>
                        </Alert>
                      )}

                      {documentsLoading ? (
                        <div className="text-sm text-muted-foreground py-4">Loading documents...</div>
                      ) : documents.length === 0 ? (
                        <div className="text-sm text-muted-foreground py-4">No documents uploaded yet</div>
                      ) : (
                        <div className="space-y-2">
                          {documents.map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{doc.filename}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatFileSize(doc.byteSize)} • {formatDate(doc.uploadedAt)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDownload(doc.id, doc.filename)}
                                  disabled={downloadAttachment.isPending}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                {isAdmin && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemove(doc.id)}
                                    disabled={archiveAttachment.isPending}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="images" className="space-y-4">
                      {isAdmin ? (
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <Input
                              ref={imageFileInputRef}
                              type="file"
                              onChange={handleImageFileSelect}
                              accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              onClick={handleImageUpload}
                              disabled={!selectedImageFile || uploadAttachment.isPending}
                              size="sm"
                            >
                              {uploadAttachment.isPending ? (
                                'Uploading...'
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload
                                </>
                              )}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Supported formats: PNG, JPEG, GIF, WebP. Maximum size: 10MB
                          </p>
                        </div>
                      ) : (
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            Only administrators can upload images. You can view and download existing images below.
                          </AlertDescription>
                        </Alert>
                      )}

                      {imagesLoading ? (
                        <div className="text-sm text-muted-foreground py-4">Loading images...</div>
                      ) : images.length === 0 ? (
                        <div className="text-sm text-muted-foreground py-4">No images uploaded yet</div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {images.map((img) => {
                            const thumbnailUrl = imageThumbnails.get(img.id);
                            return (
                              <div
                                key={img.id}
                                className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                              >
                                {thumbnailUrl ? (
                                  <div className="aspect-video bg-muted relative group">
                                    <img
                                      src={thumbnailUrl}
                                      alt={img.filename}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                      <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => handleImagePreview(img.id, img.filename)}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => handleDownload(img.id, img.filename)}
                                      >
                                        <Download className="h-4 w-4" />
                                      </Button>
                                      {isAdmin && (
                                        <Button
                                          type="button"
                                          variant="secondary"
                                          size="sm"
                                          onClick={() => handleRemove(img.id)}
                                        >
                                          <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="aspect-video bg-muted flex items-center justify-center">
                                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="p-2">
                                  <p className="text-xs font-medium truncate">{img.filename}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatFileSize(img.byteSize)}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                )}
              </div>

              {isSampleData && (
                <>
                  <Separator />
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      This is sample data and cannot be edited. Create a new program to add your own content.
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </form>
          </ScrollArea>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={handleSubmit}
              disabled={createProgram.isPending || updateProgram.isPending || isSampleData}
            >
              {createProgram.isPending || updateProgram.isPending
                ? 'Saving...'
                : isEditing
                ? 'Update Program'
                : 'Create Program'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProgramImagePreviewDialog
        open={showImagePreview}
        onOpenChange={setShowImagePreview}
        imageUrl={previewImageUrl}
        filename={previewImageFilename}
        onDownload={() => {
          const img = images.find((i) => imageThumbnails.get(i.id) === previewImageUrl);
          if (img) {
            handleDownload(img.id, img.filename);
          }
        }}
      />
    </>
  );
}
