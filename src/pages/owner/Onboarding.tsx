import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, MapPin, Phone, ImagePlus, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { restaurantService, imageService } from '@/services';
import { toast } from 'sonner';

export default function OwnerOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setImageFiles(prev => [...prev, ...files]);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error('Please sign in to continue');
      return;
    }

    if (!formData.name || !formData.address) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      // Upload images first if provided
      const uploadedImageUrls: string[] = [];
      for (const file of imageFiles) {
        const { url, error } = await imageService.upload(file, 'restaurants');
        if (error) {
          console.error('Image upload failed:', error);
        } else if (url) {
          uploadedImageUrls.push(url);
        }
      }

      // Create restaurant
      const { data: restaurant, error: createError } = await restaurantService.createRestaurant({
        owner_id: user.id,
        name: formData.name,
        description: formData.description || null,
        address: formData.address,
        phone: formData.phone || null,
        images: uploadedImageUrls.length > 0 ? uploadedImageUrls : null,
        banner_url: uploadedImageUrls.length > 0 ? uploadedImageUrls[0] : null,
        cuisine_type: ['Indian'], // Default for now
        is_open: true,
        rating: 4.5,
        delivery_time: '20-30 min'
      });

      if (createError || !restaurant) {
        throw createError || new Error('Failed to create restaurant');
      }

      toast.success('Restaurant created successfully!');
      navigate('/owner/dashboard', { replace: true });
    } catch (error) {
      console.error('Error creating restaurant:', error);
      toast.error('Failed to create restaurant. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${step >= s 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
                }
              `}>
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 3 && (
                <div className={`w-12 h-0.5 mx-2 ${step > s ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Store className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Register Your Restaurant</h1>
              <p className="text-muted-foreground">Let's start with the basic information</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Restaurant Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., The Spice Garden"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell customers about your restaurant..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="address">Address *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="address"
                    placeholder="123 Main Street, City"
                    className="pl-10"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    placeholder="+91 9876543210"
                    className="pl-10"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <Button 
              className="w-full" 
              onClick={() => setStep(2)}
              disabled={!formData.name || !formData.address}
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 2: Cuisine & Images */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <ImagePlus className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Cuisine & Branding</h1>
              <p className="text-muted-foreground">Select your cuisine types and upload images</p>
            </div>

            <div>
              <Label className="mb-3 block">Restaurant Images</Label>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative w-24 h-24">
                      <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover rounded-xl" />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-sm"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {imagePreviews.length < 5 && (
                    <div className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center">
                      <input
                        type="file"
                        accept="image/*"
                        id="images"
                        className="hidden"
                        onChange={handleImageChange}
                        multiple
                      />
                      <label htmlFor="images" className="cursor-pointer p-4">
                        <ImagePlus className="w-8 h-8 text-muted-foreground" />
                      </label>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Upload up to 5 images of your restaurant</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1">
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Submit */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Review & Submit</h1>
              <p className="text-muted-foreground">Make sure everything looks good</p>
            </div>

            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              {imagePreviews.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  {imagePreviews.map((preview, index) => (
                    <img key={index} src={preview} alt={`Preview ${index + 1}`} className="w-24 h-24 object-cover rounded-lg flex-shrink-0" />
                  ))}
                </div>
              )}
              
              <div className="flex items-center gap-4">
                {imagePreviews.length > 0 ? (
                  <img src={imagePreviews[0]} alt="Restaurant" className="w-16 h-16 rounded-xl object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Store className="w-8 h-8 text-primary" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-lg">{formData.name}</h3>
                  <p className="text-sm text-muted-foreground">{formData.address}</p>
                </div>
              </div>

              {formData.description && (
                <p className="text-sm text-muted-foreground">{formData.description}</p>
              )}

              {formData.phone && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Phone:</span> {formData.phone}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Restaurant
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
