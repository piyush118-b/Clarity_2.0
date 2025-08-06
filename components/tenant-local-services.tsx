"use client";
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  MapPin,
  ExternalLink,
  Building,
  Globe,
  Clock,
  Search,
  Filter
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { LocalService } from '@/lib/supabase/types';
import { LoadingSpinner, LoadingCard } from '@/components/ui/loading-spinner';
import { ErrorCard, EmptyState } from '@/components/ui/error-boundary';
import { toast } from 'sonner';

const SERVICE_TYPES = [
  'All Services',
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

export function TenantLocalServices() {
  const [localServices, setLocalServices] = useState<LocalService[]>([]);
  const [filteredServices, setFilteredServices] = useState<LocalService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All Services');

  const supabase = createClient();

  const fetchLocalServices = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data: services, error: servicesError } = await supabase
        .from('local_services')
        .select('*')
        .order('name', { ascending: true });

      if (servicesError) throw servicesError;
      setLocalServices(services as LocalService[] || []);
      setFilteredServices(services as LocalService[] || []);
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

  // Filter services based on search term and selected type
  useEffect(() => {
    let filtered = localServices;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by service type
    if (selectedType !== 'All Services') {
      filtered = filtered.filter(service => service.service_type === selectedType);
    }

    setFilteredServices(filtered);
  }, [localServices, searchTerm, selectedType]);

  const getServiceTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'Healthcare': 'bg-red-100 text-red-800',
      'Education': 'bg-blue-100 text-blue-800',
      'Transportation': 'bg-green-100 text-green-800',
      'Shopping': 'bg-purple-100 text-purple-800',
      'Entertainment': 'bg-pink-100 text-pink-800',
      'Government': 'bg-gray-100 text-gray-800',
      'Emergency Services': 'bg-red-100 text-red-800',
      'Banking': 'bg-yellow-100 text-yellow-800',
      'Food & Dining': 'bg-orange-100 text-orange-800',
      'Utilities': 'bg-indigo-100 text-indigo-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Local Services</h2>
          <p className="text-gray-600 mt-1">Discover local services and amenities in your area</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <LoadingCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorCard title="Error Loading Local Services" message={error} />;
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Local Services</h2>
        <p className="text-gray-600 mt-1">Discover local services and amenities in your area</p>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search services, locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="sm:w-48">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
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
      </div>

      {/* Services Count */}
      <div className="text-sm text-gray-600 mb-4">
        Showing {filteredServices.length} of {localServices.length} services
        {selectedType !== 'All Services' && ` in ${selectedType}`}
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        localServices.length === 0 ? (
          <EmptyState
            title="No Local Services Available"
            description="There are currently no local services added. Check back later for updates."
            icon={Building}
          />
        ) : (
          <EmptyState
            title="No Services Found"
            description="No services match your current search criteria. Try adjusting your search or filter."
            icon={Search}
          />
        )
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((service) => (
            <Card key={service.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 text-lg mb-2">
                      <Building className="h-5 w-5 text-blue-600" />
                      {service.name}
                    </CardTitle>
                    <Badge className={`text-xs ${getServiceTypeColor(service.service_type)}`}>
                      {service.service_type}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {service.description}
                </p>
                
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mt-0.5 text-gray-400" />
                  <span>{service.location}</span>
                </div>
                
                {service.service_link && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-gray-400" />
                    <a 
                      href={service.service_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t">
                  <Clock className="h-3 w-3" />
                  Added {new Date(service.created_at).toLocaleDateString()}
                </div>
                
                {service.service_link && (
                  <div className="pt-2">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <a href={service.service_link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visit Service
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {localServices.length > 0 && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Service Categories</h3>
          <div className="flex flex-wrap gap-2">
            {SERVICE_TYPES.slice(1).map((type) => {
              const count = localServices.filter(service => service.service_type === type).length;
              if (count === 0) return null;
              return (
                <Badge 
                  key={type} 
                  variant="secondary" 
                  className="text-xs"
                >
                  {type}: {count}
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
