import { useEffect, useState } from 'react';
import { Store, MapPin, Phone, ImagePlus, Save, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { restaurantService, imageService } from '@/services';
import OwnerLayout from '@/components/layout/OwnerLayout';
import { toast } from 'sonner';
import type { Restaurant } from '@/services/restaurantService';

type BusinessHours = {
  [key: string]: {
    open: string;
    close: string;
    closed: boolean;
  };
};

export default function OwnerSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    cuisine_type: '',
    is_open: true,
    business_hours: {} as BusinessHours,
    images: [] as string[],
    banner_url: '',
  });

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  useEffect(() => {
    const fetchRestaurant = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await restaurantService.getOwnerRestaurant(user.id);
        if (error) throw error;
        
        if (data) {
          setRestaurant(data);
          setFormData({
            name: data.name || '',
            description: data.description || '',
            address: data.address || '',
            phone: data.phone || '',
            cuisine_type: (data.cuisine_type || []).join(', '),
            is_open: data.is_open ?? true,
            business_hours: (data.business_hours as BusinessHours) || {
              monday: { open: '09:00', close: '22:00', closed: false },
              tuesday: { open: '09:00', close: '22:00', closed: false },
              wednesday: { open: '09:00', close: '22:00', closed: false },
              thursday: { open: '09:00', close: '22:00', closed: false },
              friday: { open: '09:00', close: '22:00', closed: false },
              saturday: { open: '09:00', close: '23:00', closed: false },
              sunday: { open: '09:00', close: '23:00', closed: false },
            },
            images: data.images || [],
            banner_url: data.banner_url || '',
          });
          setGalleryPreviews(data.images || []);
        }
      } catch (err) {
        console.error('Error fetching restaurant:', err);
        toast.error('Failed to load restaurant settings');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurant();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingGallery(true);
    const newUrls: string[] = [];
    const errors: string[] = [];

    try {
      for (const file of files) {
        console.log('Uploading:', file.name, file.type, `${(file.size / 1024).toFixed(2)}KB`);
        const { url, error } = await imageService.upload(file, 'restaurants');
        
        if (error) {
          console.error('Upload error for', file.name, ':', error.message);
          errors.push(`${file.name}: ${error.message}`);
        } else if (url) {
          console.log('Upload success:', url);
          newUrls.push(url);
        }
      }

      if (newUrls.length > 0) {
        setFormData(prev => {
          const updatedImages = [...prev.images, ...newUrls];
          return {
            ...prev,
            images: updatedImages,
            // If banner is empty, set first image as banner
            banner_url: prev.banner_url || updatedImages[0] || '',
          };
        });
        setGalleryPreviews(prev => [...prev, ...newUrls]);
        toast.success(`Successfully uploaded ${newUrls.length} image${newUrls.length > 1 ? 's' : ''}`);
      }

      if (errors.length > 0) {
        toast.error(`Upload failed: ${errors[0]}`);
        console.error('All upload errors:', errors);
      }
    } catch (err) {
      console.error('Upload exception:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to upload images');
    } finally {
      setUploadingGallery(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const removeGalleryImage = (index: number) => {
    setFormData(prev => {
      const newImages = prev.images.filter((_, i) => i !== index);
      let newBanner = prev.banner_url;
      
      // If we removed the banner image, pick the new first image or empty
      if (prev.images[index] === prev.banner_url) {
        newBanner = newImages[0] || '';
      }
      
      return {
        ...prev,
        images: newImages,
        banner_url: newBanner
      };
    });
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const setAsBanner = (url: string) => {
    setFormData(prev => ({ ...prev, banner_url: url }));
    toast.success('Main banner updated');
  };

  const handleBusinessHoursChange = (day: string, field: 'open' | 'close' | 'closed', value: any) => {
    setFormData(prev => ({
      ...prev,
      business_hours: {
        ...prev.business_hours,
        [day]: {
          ...prev.business_hours[day],
          [field]: value,
        },
      },
    }));
  };

  const handleSave = async () => {
    if (!restaurant || !user) return;
    
    setSaving(true);
    try {
      const updates = {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        phone: formData.phone,
        cuisine_type: formData.cuisine_type.split(',').map(s => s.trim()).filter(Boolean),
        is_open: formData.is_open,
        business_hours: formData.business_hours,
        images: formData.images,
        banner_url: formData.banner_url,
      };

      const { data, error } = await restaurantService.updateRestaurant(restaurant.id, updates);
      if (error) throw error;

      if (data) {
        setRestaurant(data);
        toast.success('Settings updated successfully');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <OwnerLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your restaurant gallery, details and hours</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Gallery Section - REPLACES Banner Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Restaurant Gallery</CardTitle>
                    <CardDescription>Upload photos of your restaurant and food</CardDescription>
                  </div>
                  <div className="relative">
                    <Button variant="outline" size="sm" disabled={uploadingGallery}>
                      {uploadingGallery ? (
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                      ) : (
                        <ImagePlus className="w-4 h-4 mr-2" />
                      )}
                      Add Photos
                    </Button>
                    <input 
                      type="file" 
                      multiple 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={handleGalleryUpload}
                      accept="image/*"
                      disabled={uploadingGallery}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {formData.images.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {formData.images.map((url, index) => (
                      <div key={index} className="group relative aspect-square rounded-lg overflow-hidden bg-muted border">
                        <img src={url} alt={`Gallery ${index}`} className="w-full h-full object-cover" />
                        
                        {/* Overlay Controls */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button 
                            variant={formData.banner_url === url ? "default" : "secondary"} 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => setAsBanner(url)}
                            title="Set as Main Banner"
                          >
                            <Store className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => removeGalleryImage(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Banner Badge */}
                        {formData.banner_url === url && (
                          <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-bold">
                            Banner
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg bg-muted/50">
                    <ImagePlus className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">No photos yet. Start by adding some!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* General Info */}
            <Card>
              <CardHeader>
                <CardTitle>General Information</CardTitle>
                <CardDescription>Basic details about your restaurant</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Restaurant Name</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    placeholder="e.g. Spice Garden"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    value={formData.description} 
                    onChange={handleInputChange} 
                    placeholder="Briefly describe your restaurant..."
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input 
                        id="phone" 
                        name="phone" 
                        className="pl-9"
                        value={formData.phone} 
                        onChange={handleInputChange} 
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cuisine_type">Cuisines (comma separated)</Label>
                    <Input 
                      id="cuisine_type" 
                      name="cuisine_type" 
                      value={formData.cuisine_type} 
                      onChange={handleInputChange} 
                      placeholder="North Indian, Chinese, Italian"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="address" 
                      name="address" 
                      className="pl-9"
                      value={formData.address} 
                      onChange={handleInputChange} 
                      placeholder="Full restaurant address"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Hours */}
            <Card>
              <CardHeader>
                <CardTitle>Business Hours</CardTitle>
                <CardDescription>Set when your restaurant is open for orders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {days.map((day) => (
                    <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="capitalize font-medium w-24">{day}</span>
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={!formData.business_hours[day]?.closed} 
                            onCheckedChange={(checked) => handleBusinessHoursChange(day, 'closed', !checked)}
                          />
                          <span className="text-xs text-muted-foreground">
                            {formData.business_hours[day]?.closed ? 'Closed' : 'Open'}
                          </span>
                        </div>
                      </div>
                      
                      {!formData.business_hours[day]?.closed && (
                        <div className="flex items-center gap-2">
                          <Input 
                            type="time" 
                            className="w-32" 
                            value={formData.business_hours[day]?.open || '09:00'}
                            onChange={(e) => handleBusinessHoursChange(day, 'open', e.target.value)}
                          />
                          <span className="text-muted-foreground">to</span>
                          <Input 
                            type="time" 
                            className="w-32" 
                            value={formData.business_hours[day]?.close || '22:00'}
                            onChange={(e) => handleBusinessHoursChange(day, 'close', e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Store Status */}
            <Card>
              <CardHeader>
                <CardTitle>Restaurant Status</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between p-6">
                <div className="space-y-1">
                  <p className="font-medium">{formData.is_open ? 'Currently Open' : 'Currently Closed'}</p>
                  <p className="text-xs text-muted-foreground">Toggle this to manually override your hours</p>
                </div>
                <Switch 
                  checked={formData.is_open} 
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_open: checked }))}
                />
              </CardContent>
            </Card>

            <div className="pt-4">
              <Button variant="outline" className="w-full text-destructive hover:bg-destructive/5 hover:text-destructive border-destructive/20">
                Deactivate Restaurant
              </Button>
            </div>
          </div>
        </div>
      </div>
    </OwnerLayout>
  );
}
