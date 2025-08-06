'use client';

import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Clock, CheckCircle, AlertTriangle, Users, FileText, Send, Eye } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { MaintenanceRequest } from '@/lib/supabase/types';
import { SimpleDashboardLayout } from '@/components/simple-dashboard-layout';
import { LoadingSpinner, LoadingCard } from '@/components/ui/loading-spinner';
import { ErrorCard, EmptyState } from '@/components/ui/error-boundary';
import { toast } from 'sonner';
import { useCreateNotification } from '@/components/notification-system';

export function EnhancedSupportDashboardV2() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const supabase = createClient();
  const { createNotification } = useCreateNotification();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'urgent' | 'in_progress'>('all');
  const [displayCount, setDisplayCount] = useState(7);
  const [showAll, setShowAll] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase.from('maintenance_requests')
          .select('*')
          .in('status', ['pending', 'assigned', 'in_progress']);

        if (error) throw error;
        setRequests(data || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
        setError(errorMessage);
        toast.error('Failed to load support dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleUpdateRequestStatus = async (requestId: number, newStatus: string) => {
    try {
      setIsSubmitting(true);
      const request = requests.find(r => r.id === requestId);
      if (!request) throw new Error('Request not found');

      const { error } = await supabase
        .from('maintenance_requests')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) throw error;

      if (request.tenant_id) {
        await createNotification(
          request.tenant_id, 
          'Maintenance Request Update', 
          `Your request status is now: ${newStatus.replace('_', ' ')}`, 
          'info'
        );
      }

      // Update the specific request in state
      setRequests(prevRequests => 
        prevRequests.map(r => 
          r.id === requestId ? { ...r, status: newStatus, updated_at: new Date().toISOString() } : r
        )
      );
      
      // Update selected request if it's the one being updated
      if (selectedRequest && selectedRequest.id === requestId) {
        setSelectedRequest({ ...selectedRequest, status: newStatus, updated_at: new Date().toISOString() });
      }
      
      toast.success('Request status updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update status';
      toast.error(errorMessage);
      console.error('Status update error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTicketClick = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const inProgressRequests = requests.filter(r => r.status === 'in_progress');
  const urgentRequests = requests.filter(r => 
    r.description.toLowerCase().includes('urgent') || 
    r.description.toLowerCase().includes('emergency')
  );

  // Get filtered requests based on active filter
  const getFilteredRequests = () => {
    switch (activeFilter) {
      case 'pending':
        return pendingRequests;
      case 'urgent':
        return urgentRequests;
      case 'in_progress':
        return inProgressRequests;
      default:
        return requests;
    }
  };

  const filteredRequests = getFilteredRequests();
  const displayedRequests = showAll ? filteredRequests : filteredRequests.slice(0, displayCount);
  const hasMoreRequests = filteredRequests.length > displayCount;

  const handleFilterChange = (filter: 'all' | 'pending' | 'urgent' | 'in_progress') => {
    setActiveFilter(filter);
    setShowAll(false);
    setDisplayCount(7);
  };

  const handleShowMore = () => {
    setShowAll(true);
  };

  const handleShowLess = () => {
    setShowAll(false);
    setDisplayCount(7);
  };

  const dashboardContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <LoadingCard key={i} />)}
          </div>
          <LoadingCard />
        </div>
      );
    }

    if (error) {
      return <ErrorCard title="Failed to load support dashboard" message={error} onRetry={() => window.location.reload()} />;
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card 
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              activeFilter === 'all' ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
            }`}
            onClick={() => handleFilterChange('all')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />All Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{requests.length}</div>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              activeFilter === 'pending' ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
            }`}
            onClick={() => handleFilterChange('pending')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingRequests.length}</div>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              activeFilter === 'urgent' ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
            }`}
            onClick={() => handleFilterChange('urgent')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />Urgent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{urgentRequests.length}</div>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              activeFilter === 'in_progress' ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
            }`}
            onClick={() => handleFilterChange('in_progress')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inProgressRequests.length}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {activeFilter === 'all' ? 'All Maintenance Requests' : 
                   activeFilter === 'pending' ? 'Pending Requests' :
                   activeFilter === 'urgent' ? 'Urgent Requests' :
                   'In Progress Requests'}
                </CardTitle>
                <CardDescription>
                  {activeFilter === 'all' ? 'Manage and update tenant maintenance requests.' :
                   `Showing ${filteredRequests.length} ${activeFilter === 'urgent' ? 'urgent' : activeFilter.replace('_', ' ')} request${filteredRequests.length !== 1 ? 's' : ''}.`}
                </CardDescription>
              </div>
              {activeFilter !== 'all' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleFilterChange('all')}
                >
                  Clear Filter
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {filteredRequests.length === 0 ? (
              <EmptyState 
                title={activeFilter === 'all' ? "No Active Requests" : `No ${activeFilter === 'urgent' ? 'Urgent' : activeFilter.replace('_', ' ')} Requests`} 
                description={activeFilter === 'all' ? "All maintenance requests are up to date." : `No requests match the ${activeFilter} filter.`} 
              />
            ) : (
              <div className="space-y-4">
                {displayedRequests.map(request => (
                  <div 
                    key={request.id} 
                    className="border rounded-lg p-4 space-y-3 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => handleTicketClick(request)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={request.status === 'pending' ? 'destructive' : 'default'}>
                          {request.status.replace('_', ' ')}
                        </Badge>
                        {urgentRequests.some(ur => ur.id === request.id) && (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />Urgent
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {new Date(request.created_at).toLocaleDateString()}
                        </span>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{request.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Click to view details and update status</span>
                    </div>
                  </div>
                ))}
                
                {/* Show More/Less Controls */}
                {(hasMoreRequests && !showAll) && (
                  <div className="flex justify-center pt-4">
                    <Button 
                      variant="outline" 
                      onClick={handleShowMore}
                      className="flex items-center gap-2"
                    >
                      Show More ({filteredRequests.length - displayCount} remaining)
                    </Button>
                  </div>
                )}
                
                {showAll && filteredRequests.length > 7 && (
                  <div className="flex justify-center pt-4">
                    <Button 
                      variant="outline" 
                      onClick={handleShowLess}
                      className="flex items-center gap-2"
                    >
                      Show Less
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ticket Detail Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {selectedRequest && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Maintenance Request #{selectedRequest.id}
                  </DialogTitle>
                  <DialogDescription>
                    Created on {new Date(selectedRequest.created_at).toLocaleDateString()} at {new Date(selectedRequest.created_at).toLocaleTimeString()}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Status and Priority */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label>Status:</Label>
                      <Badge variant={selectedRequest.status === 'pending' ? 'destructive' : 'default'}>
                        {selectedRequest.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    {urgentRequests.some(ur => ur.id === selectedRequest.id) && (
                      <Badge variant="destructive">
                        <AlertTriangle className="h-3 w-3 mr-1" />Urgent
                      </Badge>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm whitespace-pre-wrap">{selectedRequest.description}</p>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Request ID</Label>
                      <p className="text-sm font-mono bg-muted p-2 rounded">{selectedRequest.id}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Last Updated</Label>
                      <p className="text-sm bg-muted p-2 rounded">
                        {selectedRequest.updated_at ? 
                          new Date(selectedRequest.updated_at).toLocaleString() : 
                          'Not updated'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Status Update Actions */}
                  <div className="space-y-3">
                    <Label>Update Status</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedRequest.status === 'pending' && (
                        <>
                          <Button 
                            onClick={() => handleUpdateRequestStatus(selectedRequest.id, 'in_progress')} 
                            disabled={isSubmitting}
                            className="flex items-center gap-2"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Mark In Progress
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => handleUpdateRequestStatus(selectedRequest.id, 'completed')} 
                            disabled={isSubmitting}
                            className="flex items-center gap-2"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Mark Complete
                          </Button>
                        </>
                      )}
                      {selectedRequest.status === 'in_progress' && (
                        <>
                          <Button 
                            onClick={() => handleUpdateRequestStatus(selectedRequest.id, 'completed')} 
                            disabled={isSubmitting}
                            className="flex items-center gap-2"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Mark Complete
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => handleUpdateRequestStatus(selectedRequest.id, 'pending')} 
                            disabled={isSubmitting}
                            className="flex items-center gap-2"
                          >
                            <Clock className="h-4 w-4" />
                            Mark Pending
                          </Button>
                        </>
                      )}
                      {selectedRequest.status === 'completed' && (
                        <>
                          <Button 
                            variant="outline"
                            onClick={() => handleUpdateRequestStatus(selectedRequest.id, 'in_progress')} 
                            disabled={isSubmitting}
                            className="flex items-center gap-2"
                          >
                            <Clock className="h-4 w-4" />
                            Reopen as In Progress
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => handleUpdateRequestStatus(selectedRequest.id, 'pending')} 
                            disabled={isSubmitting}
                            className="flex items-center gap-2"
                          >
                            <AlertTriangle className="h-4 w-4" />
                            Mark Pending
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Close Button */}
                  <div className="flex justify-end pt-4 border-t">
                    <Button variant="outline" onClick={handleCloseModal}>
                      Close
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  return (
    <SimpleDashboardLayout currentRole="service_provider">
      {dashboardContent()}
    </SimpleDashboardLayout>
  );
}
