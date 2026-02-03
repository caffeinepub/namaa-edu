import { useState } from 'react';
import { usePrograms, useCreateProgram, useArchiveProgram } from '../../hooks/data/usePrograms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Search, Archive, BookOpen, Info } from 'lucide-react';
import ProgramDialog from '../../components/programs/ProgramDialog';
import ArchiveConfirmDialog from '../../components/common/ArchiveConfirmDialog';
import { Program } from '../../backend';
import { toast } from 'sonner';

export default function ProgramsPage() {
  const { data: programs = [], isLoading } = usePrograms();
  const createProgram = useCreateProgram();
  const archiveProgram = useArchiveProgram();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<Program | null>(null);

  const filteredPrograms = programs.filter((program) =>
    program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    program.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    setSelectedProgram(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (program: Program) => {
    setSelectedProgram(program);
    setIsDialogOpen(true);
  };

  const handleArchive = async () => {
    if (!archiveTarget) return;
    try {
      await archiveProgram.mutateAsync({
        programId: archiveTarget.id,
        program: archiveTarget,
      });
      toast.success('Program archived successfully');
      setArchiveTarget(null);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to archive program';
      if (errorMessage.includes('Unauthorized')) {
        toast.error('You do not have permission to archive programs');
      } else {
        toast.error(errorMessage);
      }
      setArchiveTarget(null);
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
          <h3 className="text-lg font-medium">Manage Programs</h3>
          <p className="text-sm text-muted-foreground">
            Create and organize educational programs for your initiatives
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Program
        </Button>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          To upload or manage documents for a program, click "View Details" on any program card. Note that sample programs are read-only and do not support document uploads.
        </AlertDescription>
      </Alert>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search programs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredPrograms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">No programs found</h3>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              {searchQuery ? 'Try adjusting your search' : 'Get started by creating your first program'}
            </p>
            {!searchQuery && (
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Create Program
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPrograms.map((program) => (
            <Card key={program.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{program.name}</CardTitle>
                  {program.id.startsWith('sample-') && (
                    <Badge variant="outline" className="text-xs">Sample data</Badge>
                  )}
                </div>
                <CardDescription className="line-clamp-2">
                  {program.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(program)} className="flex-1">
                  View Details
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setArchiveTarget(program)}
                  disabled={program.id.startsWith('sample-')}
                >
                  <Archive className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ProgramDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        program={selectedProgram}
      />

      <ArchiveConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        onConfirm={handleArchive}
        title="Archive Program"
        description={`Are you sure you want to archive "${archiveTarget?.name}"? This action can be undone later.`}
        isPending={archiveProgram.isPending}
      />
    </div>
  );
}
