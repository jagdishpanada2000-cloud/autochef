import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import OwnerLayout from '@/components/layout/OwnerLayout';
import { useAuth } from '@/hooks/useAuth';
import { restaurantService } from '@/services';
import type { MenuSection, Restaurant } from '@/services/restaurantService';
import { toast } from 'sonner';

export default function MenuSections() {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<MenuSection | null>(null);
  const [sectionName, setSectionName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    if (!user?.id) return;

    try {
      const { data: ownerRestaurant } = await restaurantService.getOwnerRestaurant(user.id);
      if (ownerRestaurant) {
        setRestaurant(ownerRestaurant);
        const { data: sectionsData } = await restaurantService.getMenuSections(ownerRestaurant.id);
        setSections(sectionsData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load sections');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (section?: MenuSection) => {
    if (section) {
      setEditingSection(section);
      setSectionName(section.name);
    } else {
      setEditingSection(null);
      setSectionName('');
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!sectionName.trim() || !restaurant) {
      toast.error('Please enter a section name');
      return;
    }

    setSaving(true);

    try {
      if (editingSection) {
        const { error } = await restaurantService.updateMenuSection(editingSection.id, {
          name: sectionName.trim(),
        });
        if (error) throw error;
        toast.success('Section updated');
      } else {
        const { error } = await restaurantService.createMenuSection({
          restaurant_id: restaurant.id,
          owner_id: user!.id,
          name: sectionName.trim(),
          position: sections.length,
        });
        if (error) throw error;
        toast.success('Section created');
      }

      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving section:', error);
      toast.error('Failed to save section');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingSection) return;

    try {
      const { error } = await restaurantService.deleteMenuSection(editingSection.id);
      if (error) throw error;
      
      toast.success('Section deleted');
      setDeleteDialogOpen(false);
      setEditingSection(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting section:', error);
      toast.error('Failed to delete section');
    }
  };

  if (loading) {
    return (
      <OwnerLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </OwnerLayout>
    );
  }

  if (!restaurant) {
    return (
      <OwnerLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Please register your restaurant first</p>
          <Button asChild>
            <a href="/owner/onboarding">Register Restaurant</a>
          </Button>
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Menu Sections</h1>
            <p className="text-muted-foreground">Organize your menu into sections</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Section
          </Button>
        </div>

        {/* Sections List */}
        {sections.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <p className="text-muted-foreground mb-4">No sections yet. Create your first menu section.</p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Section
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {sections.map((section, index) => (
              <div
                key={section.id}
                className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/50 transition-colors"
              >
                <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
                <div className="flex-1">
                  <h3 className="font-medium">{section.name}</h3>
                  <p className="text-sm text-muted-foreground">Order: {index + 1}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(section)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      setEditingSection(section);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSection ? 'Edit Section' : 'Add Section'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Section Name</Label>
              <Input
                id="name"
                placeholder="e.g., Starters, Main Course, Desserts"
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{editingSection?.name}"? This will also delete all items in this section.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </OwnerLayout>
  );
}
