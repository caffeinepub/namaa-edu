import { useState } from 'react';
import { useOrphanages, useArchiveOrphanage } from '../../hooks/data/useOrphanages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Archive, Building2, MapPin, Users } from 'lucide-react';
import OrphanageDialog from '../../components/orphanages/OrphanageDialog';
import ArchiveConfirmDialog from '../../components/common/ArchiveConfirmDialog';
import { Orphanage } from '../../backend';
import { toast } from 'sonner';

export default function OrganizationsPage() {
  const { data: orphanages = [], isLoading } = useOrphanages();
  const archiveOrphanage = useArchiveOrphanage();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrphanage, setSelectedOrphanage] = useState<Orphanage | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<Orphanage | null>(null);

  const filteredOrphanages = orphanages.filter((orphanage) => {
    const matchesSearch = 
      orphanage.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      orphanage.region.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleCreate = () => {
    setSelectedOrphanage(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (orphanage: Orphanage) => {
    setSelectedOrphanage(orphanage);
    setIsDialogOpen(true);
  };

  const handleArchive = async () => {
    if (!archiveTarget) return;
    try {
      await archiveOrphanage.mutateAsync({
        orphanageId: archiveTarget.id,
        orphanage: archiveTarget,
      });
      toast.success('Orphanage archived successfully');
      setArchiveTarget(null);
    } catch (error) {
      toast.error('Failed to archive orphanage');
    }
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
          <h3 className="text-lg font-medium">Orphanages</h3>
          <p className="text-sm text-muted-foreground">
            Manage partner orphanages and track collaboration opportunities
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Orphanage
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or region..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredOrphanages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">No orphanages found</h3>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              {searchQuery ? 'Try adjusting your search' : 'Get started by adding your first orphanage partner'}
            </p>
            {!searchQuery && (
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Add Orphanage
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredOrphanages.map((orphanage) => (
            <Card key={orphanage.id} className="hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => handleEdit(orphanage)}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-base">{orphanage.name}</CardTitle>
                      {orphanage.id.startsWith('sample-') && (
                        <Badge variant="outline" className="text-xs">Sample</Badge>
                      )}
                    </div>
                    <CardDescription className="flex items-center gap-1 text-sm">
                      <MapPin className="h-3 w-3" />
                      {orphanage.region}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setArchiveTarget(orphanage);
                    }}
                    disabled={orphanage.id.startsWith('sample-')}
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Capacity</span>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span className="font-medium">{orphanage.currentOccupancy.toString()}/{orphanage.capacity.toString()}</span>
                  </div>
                </div>
                {orphanage.priorityNeeds && (
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    <span className="font-medium">Needs:</span> {orphanage.priorityNeeds}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <OrphanageDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        orphanage={selectedOrphanage}
      />

      <ArchiveConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        onConfirm={handleArchive}
        title="Archive Orphanage"
        description={`Are you sure you want to archive "${archiveTarget?.name}"? This will remove it from active partner lists.`}
        isPending={archiveOrphanage.isPending}
      />
    </div>
  );
}
