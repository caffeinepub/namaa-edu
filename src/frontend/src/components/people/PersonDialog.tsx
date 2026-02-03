import { useState, useEffect } from 'react';
import { useCreatePerson } from '../../hooks/data/usePeople';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Person } from '../../backend';
import { toast } from 'sonner';

interface PersonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person?: Person | null;
}

const roleOptions = ['Volunteer', 'Facilitator', 'Builder', 'Coordinator', 'Other'];

export default function PersonDialog({ open, onOpenChange, person }: PersonDialogProps) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [role, setRole] = useState('Volunteer');
  
  const createPerson = useCreatePerson();

  const isEditing = !!person;

  useEffect(() => {
    if (person) {
      setName(person.name);
      setContact(person.contact);
      setRole(person.role);
    } else {
      setName('');
      setContact('');
      setRole('Volunteer');
    }
  }, [person, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Please enter a name');
      return;
    }

    if (!contact.trim()) {
      toast.error('Please enter contact information');
      return;
    }

    try {
      if (!isEditing) {
        await createPerson.mutateAsync({
          name: name.trim(),
          contact: contact.trim(),
          role,
          isActive: true,
          isArchived: false,
        });
        toast.success('Person added successfully');
      }
      onOpenChange(false);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to add person';
      if (errorMessage.includes('Unauthorized')) {
        toast.error('You do not have permission to add people');
      } else {
        toast.error(errorMessage);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Person Details' : 'Add New Person'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'View person information' : 'Add a new volunteer, facilitator, or builder to your team'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="e.g., John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isEditing}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact">Contact *</Label>
            <Input
              id="contact"
              placeholder="e.g., john@example.com or +62 812 3456 7890"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              disabled={isEditing}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select value={role} onValueChange={setRole} disabled={isEditing}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {isEditing ? 'Close' : 'Cancel'}
            </Button>
            {!isEditing && (
              <Button 
                type="submit" 
                disabled={createPerson.isPending}
              >
                {createPerson.isPending ? 'Adding...' : 'Add Person'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
