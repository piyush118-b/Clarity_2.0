"use client";
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  MapPin,
  Plus,
  Eye,
  ExternalLink,
  Edit,
  Trash2,
  Building,
  Phone,
  Globe,
  Clock
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { LocalService } from '@/lib/supabase/types';
import { LoadingSpinner, LoadingCard } from '@/components/ui/loading-spinner';
import { ErrorCard, EmptyState } from '@/components/ui/error-boundary';
import { NotificationSystem, useCreateNotification } from '@/components/notification-system';
import { toast } from 'sonner';

const SERVICE_TYPES = [
  'Healthcare',
  'Education',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Government',
  'Emergency Services',
  'Banking',
  'Food & Dining',
  'Utilities',
  'Other'
];

export default function EnhancedAdminLocalServices() {
  const { createNotification } = useCreateNotification(); // Initialize the createNotification function with proper destructuring
  const [localServices, setLocalServices] = useState<LocalService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showViewList, setShowViewList] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    service_type: '',
    service_link: '',
    location: ''
  });

  const supabase = createClient();

  const fetchLocalServices = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data: services, error: servicesError } = await supabase
        .from('local_services')
        .select('*')
        .order('created_at', { ascending: false });

      if (servicesError) throw servicesError;
      setLocalServices(services as LocalService[] || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load local services';
      console.error('Error fetching local services:', err);
      setError(errorMessage);
      toast.error('Failed to load local services');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocalServices();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.service_type || !formData.location) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error: insertError } = await supabase
        .from('local_services')
        .insert({
          name: formData.name,
          description: formData.description,
          service_type: formData.service_type,
          service_link: formData.service_link,
          location: formData.location,
          created_by: user.id
        });

      if (insertError) throw insertError;

      toast.success('Local service added successfully');
      setShowAddDialog(false);
      setFormData({
        name: '',
        description: '',
        service_type: '',
        service_link: '',
        location: ''
      });
      fetchLocalServices(); // Refresh the list

      // Notify users with matching location and service type
      const { data: matchingUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id, location, service_interests') // Assuming 'location' and 'service_interests' fields exist in profiles
        .eq('location', formData.location);

      if (usersError) throw usersError;

      if (matchingUsers && matchingUsers.length > 0) {
        let notifiedCount = 0;
        for (const u of matchingUsers) {
          // Further filter by service_type if service_interests exists and includes the new service type
          const userInterests = u.service_interests || []; // Assuming service_interests is an array of strings
          if (userInterests.includes(formData.service_type) || userInterests.length === 0) { // Notify if interested or if no specific interests are set
            // Using the useCreateNotification hook from notification-system
            await createNotification(
              u.id,
              `New Local Service in Your Area: ${formData.service_type}`,
              `A new service '${formData.name}' of type '${formData.service_type}' has been added in your area (${formData.location}). Check it out! ${formData.service_link || ''}`,
              'info'
            );
            notifiedCount++;
          }
        }
        if (notifiedCount > 0) {
          toast.info(`Notified ${notifiedCount} users in ${formData.location} about the new service.`);
        }
      }

    } catch (err) {
      let errorMessage = 'Failed to add local service';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        // Handle Supabase error objects which might have code, message, details properties
        const errorObj = err as any;
        if (errorObj.message) errorMessage = errorObj.message;
        if (errorObj.details) errorMessage += `: ${errorObj.details}`;
        if (errorObj.hint) errorMessage += ` (Hint: ${errorObj.hint})`;
        if (errorObj.code) errorMessage += ` (Code: ${errorObj.code})`;
      }
      
      console.error('Error adding local service:', JSON.stringify(err, null, 2));
      toast.error(`Failed to add local service: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (serviceId: number) => {
    if (!confirm('Are you sure you want to delete this local service?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('local_services')
        .delete()
        .eq('id', serviceId);

      if (deleteError) throw deleteError;

      toast.success('Local service deleted successfully');
      fetchLocalServices(); // Refresh the list
    } catch (err) {
      let errorMessage = 'Failed to delete local service';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        // Handle Supabase error objects which might have code, message, details properties
        const errorObj = err as any;
        if (errorObj.message) errorMessage = errorObj.message;
        if (errorObj.details) errorMessage += `: ${errorObj.details}`;
        if (errorObj.hint) errorMessage += ` (Hint: ${errorObj.hint})`;
        if (errorObj.code) errorMessage += ` (Code: ${errorObj.code})`;
      }
      
      console.error('Error deleting local service:', JSON.stringify(err, null, 2));
      toast.error(`Failed to delete local service: ${errorMessage}`);
    }
  };

  if (showViewList) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="outline" 
            onClick={() => setShowViewList(false)}
            className="hover:bg-gray-50 ml-auto"
          >
            ← Back to Dashboard
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <LoadingCard key={i} />
            ))}
          </div>
        ) : error ? (
          <ErrorCard title="Error Loading Local Services" message={error} />
        ) : localServices.length === 0 ? (
          <EmptyState
            title="No Local Services Added"
            description="Start by adding your first local service to help tenants find nearby amenities."
            icon={Building}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {localServices.map((service) => (
              <Card key={service.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building className="h-5 w-5" />
                    {service.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Badge variant="secondary">{service.service_type}</Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-700">{service.description}</p>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    {service.location}
                  </div>
                  
                  {service.service_link && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4" />
                      <a 
                        href={service.service_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    Added {new Date(service.created_at).toLocaleDateString()}
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    {service.service_link && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={service.service_link} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Visit
                        </a>
                      </Button>
                    )}
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDelete(service.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Local Service
            </CardTitle>
            <CardDescription>
              Add a new local service for tenants to discover
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Service
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Local Service</DialogTitle>
                  <DialogDescription>
                    Fill in the details for the new local service
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Service Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., City Hospital"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of the service"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="service_type">Service Type *</Label>
                    <Select 
                      value={formData.service_type} 
                      onValueChange={(value) => setFormData({ ...formData, service_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="service_link">Website/Link</Label>
                    <Input
                      id="service_link"
                      type="url"
                      value={formData.service_link}
                      onChange={(e) => setFormData({ ...formData, service_link: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., 123 Main St, City"
                      required
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowAddDialog(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      {isSubmitting ? (
                        <>
                          <LoadingSpinner className="h-4 w-4 mr-2" />
                          Adding...
                        </>
                      ) : (
                        'Add Service'
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowViewList(true)}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              View Services List
            </CardTitle>
            <CardDescription>
              View and manage all added local services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {localServices.length}
            </div>
            <p className="text-sm text-gray-600">
              {localServices.length === 1 ? 'Service' : 'Services'} Added
            </p>
            <Button variant="outline" className="w-full mt-4">
              <Eye className="h-4 w-4 mr-2" />
              View All Services
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
