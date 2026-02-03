import { useState } from 'react';
import { usePeople, useCreatePerson, useArchivePerson } from '../../hooks/data/usePeople';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Archive, Users } from 'lucide-react';
import PersonDialog from '../../components/people/PersonDialog';
import ArchiveConfirmDialog from '../../components/common/ArchiveConfirmDialog';
import { Person } from '../../backend';
import { toast } from 'sonner';

export default function PeoplePage() {
  const { data: people = [], isLoading } = usePeople();
  const createPerson = useCreatePerson();
  const archivePerson = useArchivePerson();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<Person | null>(null);

  const filteredPeople = people.filter((person) => {
    const matchesSearch = person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         person.contact.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || person.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const uniqueRoles = Array.from(new Set(people.map(p => p.role)));

  const handleCreate = () => {
    setSelectedPerson(null);
    setIsDialogOpen(true);
  };

  const handleView = (person: Person) => {
    setSelectedPerson(person);
    setIsDialogOpen(true);
  };

  const handleArchive = async () => {
    if (!archiveTarget) return;
    try {
      await archivePerson.mutateAsync({
        personId: archiveTarget.id,
        person: archiveTarget,
      });
      toast.success('Person archived successfully');
      setArchiveTarget(null);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to archive person';
      if (errorMessage.includes('Unauthorized')) {
        toast.error('You do not have permission to archive people');
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
          <h3 className="text-lg font-medium">People</h3>
          <p className="text-sm text-muted-foreground">
            Manage volunteers, facilitators, and program builders
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Person
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {uniqueRoles.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredPeople.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">No people found</h3>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              {searchQuery || roleFilter !== 'all' ? 'Try adjusting your filters' : 'Get started by adding your first person'}
            </p>
            {!searchQuery && roleFilter === 'all' && (
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Add Person
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPeople.map((person) => (
            <Card key={person.idText} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{person.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {person.contact}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">{person.role}</Badge>
                </div>
              </CardHeader>
              <CardContent className="mt-auto flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleView(person)} className="flex-1">
                  View Details
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setArchiveTarget(person)}
                >
                  <Archive className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PersonDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        person={selectedPerson}
      />

      <ArchiveConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        onConfirm={handleArchive}
        title="Archive Person"
        description={`Are you sure you want to archive "${archiveTarget?.name}"? This action can be undone later.`}
        isPending={archivePerson.isPending}
      />
    </div>
  );
}
