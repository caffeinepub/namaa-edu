import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

interface ProgramImagePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  filename: string;
  onDownload: () => void;
}

export default function ProgramImagePreviewDialog({
  open,
  onOpenChange,
  imageUrl,
  filename,
  onDownload,
}: ProgramImagePreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="truncate pr-4">{filename}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-center bg-muted/30 rounded-lg overflow-hidden max-h-[calc(90vh-200px)]">
          <img
            src={imageUrl}
            alt={filename}
            className="max-w-full max-h-full object-contain"
          />
        </div>
        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
          <Button type="button" onClick={onDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
