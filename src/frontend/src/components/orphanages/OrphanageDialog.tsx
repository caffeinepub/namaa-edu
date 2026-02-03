import { useState, useEffect } from 'react';
import { useCreateOrphanage, useUpdateOrphanage } from '../../hooks/data/useOrphanages';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Orphanage } from '../../backend';
import { toast } from 'sonner';

interface OrphanageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orphanage?: Orphanage | null;
}

export default function OrphanageDialog({ open, onOpenChange, orphanage }: OrphanageDialogProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [region, setRegion] = useState('');
  const [primaryContact, setPrimaryContact] = useState('');
  const [secondaryContact, setSecondaryContact] = useState('');
  const [capacity, setCapacity] = useState('');
  const [currentOccupancy, setCurrentOccupancy] = useState('');
  const [demographicNotes, setDemographicNotes] = useState('');
  const [constraints, setConstraints] = useState('');
  const [priorityNeeds, setPriorityNeeds] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  
  const createOrphanage = useCreateOrphanage();
  const updateOrphanage = useUpdateOrphanage();

  const isEditing = !!orphanage;

  useEffect(() => {
    if (orphanage) {
      setName(orphanage.name);
      setAddress(orphanage.address);
      setRegion(orphanage.region);
      setPrimaryContact(orphanage.primaryContact);
      setSecondaryContact(orphanage.secondaryContact || '');
      setCapacity(orphanage.capacity.toString());
      setCurrentOccupancy(orphanage.currentOccupancy.toString());
      setDemographicNotes(orphanage.demographicNotes);
      setConstraints(orphanage.constraints);
      setPriorityNeeds(orphanage.priorityNeeds);
      setInternalNotes(orphanage.internalNotes);
    } else {
      setName('');
      setAddress('');
      setRegion('');
      setPrimaryContact('');
      setSecondaryContact('');
      setCapacity('');
      setCurrentOccupancy('');
      setDemographicNotes('');
      setConstraints('');
      setPriorityNeeds('');
      setInternalNotes('');
    }
  }, [orphanage, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Please enter orphanage name');
      return;
    }

    if (!address.trim()) {
      toast.error('Please enter address');
      return;
    }

    if (!region.trim()) {
      toast.error('Please enter region');
      return;
    }

    if (!primaryContact.trim()) {
      toast.error('Please enter primary contact');
      return;
    }

    const capacityNum = parseInt(capacity);
    const occupancyNum = parseInt(currentOccupancy);

    if (isNaN(capacityNum) || capacityNum < 0) {
      toast.error('Please enter a valid capacity');
      return;
    }

    if (isNaN(occupancyNum) || occupancyNum < 0) {
      toast.error('Please enter a valid current occupancy');
      return;
    }

    try {
      const orphanageData: Orphanage = {
        id: isEditing ? orphanage.id : `orph-${Date.now()}`,
        name: name.trim(),
        address: address.trim(),
        region: region.trim(),
        primaryContact: primaryContact.trim(),
        secondaryContact: secondaryContact.trim() || undefined,
        capacity: BigInt(capacityNum),
        currentOccupancy: BigInt(occupancyNum),
        demographicNotes: demographicNotes.trim(),
        constraints: constraints.trim(),
        priorityNeeds: priorityNeeds.trim(),
        internalNotes: internalNotes.trim(),
        isActive: true,
      };

      if (isEditing) {
        await updateOrphanage.mutateAsync(orphanageData);
        toast.success('Orphanage updated successfully');
      } else {
        await createOrphanage.mutateAsync(orphanageData);
        toast.success('Orphanage created successfully');
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(isEditing ? 'Failed to update orphanage' : 'Failed to create orphanage');
    }
  };

  const isSampleData = orphanage?.id.startsWith('sample-');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Orphanage' : 'Create New Orphanage'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update orphanage partner information' : 'Add a new orphanage partner to your network'}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground">Profile Information</h4>
              <div className="space-y-2">
                <Label htmlFor="name">Orphanage Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Panti Asuhan Al-Ikhlas"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSampleData}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  placeholder="Full street address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={isSampleData}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Region *</Label>
                <Input
                  id="region"
                  placeholder="e.g., Jakarta Selatan, Bandung"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  disabled={isSampleData}
                />
              </div>
            </div>

            {/* Contact Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground">Contact Information</h4>
              <div className="space-y-2">
                <Label htmlFor="primaryContact">Primary Contact *</Label>
                <Input
                  id="primaryContact"
                  placeholder="Phone number or email"
                  value={primaryContact}
                  onChange={(e) => setPrimaryContact(e.target.value)}
                  disabled={isSampleData}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryContact">Secondary Contact</Label>
                <Input
                  id="secondaryContact"
                  placeholder="Alternative phone or email (optional)"
                  value={secondaryContact}
                  onChange={(e) => setSecondaryContact(e.target.value)}
                  disabled={isSampleData}
                />
              </div>
            </div>

            {/* Capacity Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground">Capacity Snapshot</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity">Total Capacity *</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="0"
                    placeholder="e.g., 50"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    disabled={isSampleData}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentOccupancy">Current Occupancy *</Label>
                  <Input
                    id="currentOccupancy"
                    type="number"
                    min="0"
                    placeholder="e.g., 42"
                    value={currentOccupancy}
                    onChange={(e) => setCurrentOccupancy(e.target.value)}
                    disabled={isSampleData}
                  />
                </div>
              </div>
            </div>

            {/* Demographics Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground">Demographics & Context</h4>
              <div className="space-y-2">
                <Label htmlFor="demographicNotes">Demographic Notes</Label>
                <Textarea
                  id="demographicNotes"
                  placeholder="Age ranges, gender distribution, special needs, etc."
                  value={demographicNotes}
                  onChange={(e) => setDemographicNotes(e.target.value)}
                  rows={3}
                  disabled={isSampleData}
                />
              </div>
            </div>

            {/* Needs & Constraints Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground">Needs & Constraints</h4>
              <div className="space-y-2">
                <Label htmlFor="priorityNeeds">Priority Needs</Label>
                <Textarea
                  id="priorityNeeds"
                  placeholder="Educational materials, mentorship, specific programs, etc."
                  value={priorityNeeds}
                  onChange={(e) => setPriorityNeeds(e.target.value)}
                  rows={3}
                  disabled={isSampleData}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="constraints">Constraints</Label>
                <Textarea
                  id="constraints"
                  placeholder="Scheduling limitations, facility restrictions, etc."
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                  rows={3}
                  disabled={isSampleData}
                />
              </div>
            </div>

            {/* Internal Notes Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground">Internal Notes</h4>
              <div className="space-y-2">
                <Label htmlFor="internalNotes">Internal Notes</Label>
                <Textarea
                  id="internalNotes"
                  placeholder="Private notes for internal team use only"
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  rows={3}
                  disabled={isSampleData}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              {!isSampleData && (
                <Button 
                  type="submit" 
                  disabled={createOrphanage.isPending || updateOrphanage.isPending}
                >
                  {createOrphanage.isPending || updateOrphanage.isPending
                    ? 'Saving...'
                    : isEditing
                    ? 'Update Orphanage'
                    : 'Create Orphanage'}
                </Button>
              )}
            </DialogFooter>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
