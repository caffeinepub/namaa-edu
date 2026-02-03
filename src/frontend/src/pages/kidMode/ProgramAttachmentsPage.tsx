import { useKidProgramAttachments } from '../../hooks/kidMode/useKidPrograms';
import { useDownloadProgramAttachment } from '../../hooks/data/useProgramAttachments';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ProgramAttachmentsPageProps {
  programId: string;
  onBack: () => void;
}

export default function ProgramAttachmentsPage({ programId, onBack }: ProgramAttachmentsPageProps) {
  const { data: attachments, isLoading } = useKidProgramAttachments(programId);
  const downloadAttachment = useDownloadProgramAttachment();

  const handleDownload = async (attachmentId: string, filename: string) => {
    try {
      await downloadAttachment.mutateAsync({ attachmentId, filename });
      toast.success(`Downloaded ${filename}`);
    } catch (error) {
      toast.error('Failed to download file');
      console.error('Download error:', error);
    }
  };

  const documents = attachments?.filter(a => !a.isImage) || [];
  const images = attachments?.filter(a => a.isImage) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading materials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Programs
        </Button>
      </div>

      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Program Materials
        </h2>
        <p className="text-muted-foreground">
          Download and view materials for this program
        </p>
      </div>

      {(!attachments || attachments.length === 0) && (
        <Card className="border-2 border-dashed">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle>No Materials Yet</CardTitle>
            <CardDescription>
              There are no materials available for this program yet. Check back later!
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {documents.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm line-clamp-2">
                        {doc.filename}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {(Number(doc.byteSize) / 1024).toFixed(1)} KB
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => handleDownload(doc.id, doc.filename)}
                    disabled={downloadAttachment.isPending}
                    className="w-full gap-2"
                    size="sm"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {images.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Images
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((img) => (
              <Card key={img.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                      <ImageIcon className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm line-clamp-2">
                        {img.filename}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {(Number(img.byteSize) / 1024).toFixed(1)} KB
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => handleDownload(img.id, img.filename)}
                    disabled={downloadAttachment.isPending}
                    className="w-full gap-2"
                    size="sm"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
