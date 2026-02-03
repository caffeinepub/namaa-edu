import { useState } from 'react';
import { useAllDocumentation, useArchiveDocumentationEntry } from '../../hooks/data/useDocumentation';
import { useActivities } from '../../hooks/data/useActivities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Archive, FileText } from 'lucide-react';
import DocumentationEntryDialog from '../../components/documentation/DocumentationEntryDialog';
import ArchiveConfirmDialog from '../../components/common/ArchiveConfirmDialog';
import { DocumentationEntry } from '../../backend';
import { toast } from 'sonner';

export default function DocumentationPage() {
  const { data: documentation = [], isLoading } = useAllDocumentation();
  const { data: activities = [] } = useActivities();
  const archiveEntry = useArchiveDocumentationEntry();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [selectedEntry, setSelectedEntry] = useState<DocumentationEntry | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<DocumentationEntry | null>(null);

  const filteredDocumentation = documentation.filter((entry) => {
    const matchesSearch = entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         entry.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesActivity = activityFilter === 'all' || entry.activityId === activityFilter;
    return matchesSearch && matchesActivity;
  });

  const handleCreate = () => {
    setSelectedEntry(null);
    setIsDialogOpen(true);
  };

  const handleView = (entry: DocumentationEntry) => {
    setSelectedEntry(entry);
    setIsDialogOpen(true);
  };

  const handleArchive = async () => {
    if (!archiveTarget) return;
    try {
      await archiveEntry.mutateAsync({
        entryId: archiveTarget.id,
        entry: archiveTarget,
      });
      toast.success('Documentation entry archived successfully');
      setArchiveTarget(null);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to archive entry';
      if (errorMessage.includes('Unauthorized')) {
        toast.error('You do not have permission to archive documentation');
      } else {
        toast.error(errorMessage);
      }
      setArchiveTarget(null);
    }
  };

  const getActivityTitle = (activityId: string) => {
    const activity = activities.find(a => a.id === activityId);
    return activity?.title || activityId;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Documentation</h3>
          <p className="text-sm text-muted-foreground">
            Store notes, reflections, and outcomes from your activities
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Entry
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search documentation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={activityFilter} onValueChange={setActivityFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by activity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Activities</SelectItem>
            {activities.map((activity) => (
              <SelectItem key={activity.id} value={activity.id}>
                {activity.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredDocumentation.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">No documentation found</h3>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              {searchQuery || activityFilter !== 'all' ? 'Try adjusting your filters' : 'Get started by creating your first documentation entry'}
            </p>
            {!searchQuery && activityFilter === 'all' && (
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Create Entry
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredDocumentation.map((entry) => (
            <Card key={entry.idText} className="hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => handleView(entry)}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-base">
                        {getActivityTitle(entry.activityId)}
                      </CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {entry.author}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm line-clamp-2">
                      {entry.content}
                    </CardDescription>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(Number(entry.timestamp)).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setArchiveTarget(entry);
                    }}
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <DocumentationEntryDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        entry={selectedEntry}
      />

      <ArchiveConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        onConfirm={handleArchive}
        title="Archive Documentation Entry"
        description="Are you sure you want to archive this documentation entry? This action can be undone later."
        isPending={archiveEntry.isPending}
      />
    </div>
  );
}
