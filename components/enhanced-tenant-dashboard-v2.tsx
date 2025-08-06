'use client';

import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, } from '@/components/ui/dialog';
import { 
  FileText, 
  Upload, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Plus, 
  Eye, 
  Download, 
  Wrench, 
  User, 
  Calendar, 
  Bell, 
  MessageSquare,
  MapPin 
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Document, Agreement, Violation, ServiceCharge, MaintenanceRequest, Notification } from '@/lib/supabase/types';
import { NotificationSystem, useCreateNotification } from '@/components/notification-system';
import { TenantLocalServices } from '@/components/tenant-local-services';

import { SimpleDashboardLayout } from '@/components/simple-dashboard-layout';
import { LoadingSpinner, LoadingCard } from '@/components/ui/loading-spinner';
import { ErrorCard, EmptyState } from '@/components/ui/error-boundary';
import { EnhancedUploadService } from '@/components/enhanced-upload-service';
import { toast } from 'sonner';

export function EnhancedTenantDashboardV2() {
  // Existing Supabase state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [charges, setCharges] = useState<ServiceCharge[]>([]);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const supabase = createClient();
  const { createNotification } = useCreateNotification();
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<'maintenance' | 'general_support'>('maintenance');
  const [selectedPriority, setSelectedPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New UI state
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showLocalServices, setShowLocalServices] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Fetch all data in parallel
        const [docsResult, agreementsResult, violationsResult, chargesResult, requestsResult, notificationsResult] = await Promise.all([
          supabase.from('documents').select('*').eq('user_id', user.id),
          supabase.from('agreements').select('*').eq('tenant_id', user.id),
          supabase.from('violations').select('*').eq('tenant_id', user.id),
          supabase.from('service_charges').select('*').eq('tenant_id', user.id),
          supabase.from('maintenance_requests').select('*').eq('tenant_id', user.id),
          supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
        ]);

        // Check for errors
        if (docsResult.error) throw docsResult.error;
        if (agreementsResult.error) throw agreementsResult.error;
        if (violationsResult.error) throw violationsResult.error;
        if (chargesResult.error) throw chargesResult.error;
        if (requestsResult.error) throw requestsResult.error;
        if (notificationsResult.error) throw notificationsResult.error;

        // Set data
        setDocuments(docsResult.data as Document[] || []);
        setAgreements(agreementsResult.data as Agreement[] || []);
        setViolations(violationsResult.data as Violation[] || []);
        setCharges(chargesResult.data as ServiceCharge[] || []);
        setRequests(requestsResult.data as MaintenanceRequest[] || []);
        setNotifications(notificationsResult.data as Notification[] || []);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
        console.error('Error fetching data:', errorMessage);
        setError(errorMessage);
        toast.error('Failed to load tenant dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsSubmitting(true);
      const { data, error } = await supabase.storage.from('documents').upload(`tenant/${file.name}`, file);
      
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      await supabase.from('documents').insert({ 
        user_id: user.id,
        file_path: data.path,
        status: 'pending', // Set initial status to pending
        uploaded_at: new Date().toISOString()
      });

      // Re-fetch documents with profile information
      const { data: docs } = await supabase.from('documents').select('*').eq('user_id', user.id);
      setDocuments(docs as Document[] || []);
      
      toast.success('Document uploaded successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload document';
      console.error('Upload error:', errorMessage);
      toast.error('Failed to upload document');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitRequest = async () => {
    const description = descriptionRef.current?.value;
    if (!description?.trim()) {
      toast.error('Please enter a description');
      return;
    }

    try {
      setIsSubmitting(true);
      const file = imageRef.current?.files?.[0];
      let image_path: string | null = null;
      
      if (file) {
        const { data, error } = await supabase.storage.from('requests').upload(`tenant/${file.name}`, file);
        if (error) throw error;
        image_path = data.path;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      await supabase.from('maintenance_requests').insert({ 
        tenant_id: user.id,
        description,
        image_path: image_path,
        status: 'pending',
        category: selectedCategory,
        priority: selectedPriority,
        created_at: new Date().toISOString() 
      });

      // Notify all admins about the new support request
      const { data: adminUsers } = await supabase
        .from('profiles')
        .select('id')
        .eq('role_id', 1); // Assuming role_id 1 is admin

      if (adminUsers) {
        const categoryLabel = selectedCategory === 'maintenance' ? 'Maintenance Request' : 'General Support Request';
        const priorityLabel = selectedPriority.charAt(0).toUpperCase() + selectedPriority.slice(1);
        
        for (const admin of adminUsers) {
          await createNotification(
            admin.id,
            `New ${categoryLabel}`,
            `A tenant has submitted a new ${priorityLabel.toLowerCase()} priority ${categoryLabel.toLowerCase()}: ${description.substring(0, 100)}${description.length > 100 ? '...' : ''}`,
            selectedPriority === 'urgent' ? 'warning' : 'info'
          );
        }
      }

      // Re-fetch requests
      const { data: reqs } = await supabase.from('maintenance_requests').select('*').eq('tenant_id', user.id);
      setRequests(reqs as MaintenanceRequest[] || []);
      
      // Reset form
      if (descriptionRef.current) descriptionRef.current.value = '';
      if (imageRef.current) imageRef.current.value = '';
      setShowMaintenanceForm(false);
      
      toast.success(`${selectedCategory === 'maintenance' ? 'Maintenance request' : 'Support request'} submitted successfully`);
      
      // Reset form
      setSelectedCategory('maintenance');
      setSelectedPriority('medium');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit maintenance request';
      console.error('Submit error:', errorMessage);
      toast.error('Failed to submit maintenance request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignAgreement = async (id: number) => {
    try {
      setIsSubmitting(true);
      
      // Get the agreement details first
      const agreement = agreements.find(a => a.id === id);
      if (!agreement) {
        throw new Error('Agreement not found');
      }
      
      await supabase.from('agreements').update({ 
        signed: true, 
        signed_at: new Date().toISOString() 
      }).eq('id', id);

      // Create notification for all admins about agreement signing
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin');
      
      if (admins && admins.length > 0) {
        for (const admin of admins) {
          const result = await createNotification(
            admin.id,
            'Agreement Signed',
            `A tenant has signed an agreement. Agreement content: ${agreement.content.substring(0, 100)}...`,
            'success'
          );
          if (!result.success) {
            console.error('Failed to create notification for admin:', admin.id, result.error);
          }
        }
      }

      // Re-fetch agreements
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: agrees } = await supabase.from('agreements').select('*').eq('tenant_id', user.id);
        setAgreements(agrees as Agreement[] || []);
      }
      
      toast.success('Agreement signed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign agreement';
      console.error('Sign error:', errorMessage);
      toast.error('Failed to sign agreement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayCharge = async (id: number, amount: number) => {
    try {
      setIsSubmitting(true);
      
      // Get the charge details first
      const charge = charges.find(c => c.id === id);
      if (!charge) {
        throw new Error('Charge not found');
      }
      
      // Mock payment
      await supabase.from('payments').insert({ 
        charge_id: id, 
        amount, 
        payment_date: new Date().toISOString(), 
        status: 'paid' 
      });
      
      await supabase.from('service_charges').update({ status: 'paid' }).eq('id', id);

      // Create notification for all admins about payment
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin');
      
      if (admins && admins.length > 0) {
        for (const admin of admins) {
          const result = await createNotification(
            admin.id,
            'Payment Received',
            `A tenant has made a payment of $${amount} for service charge (Due: ${new Date(charge.due_date).toLocaleDateString()})`,
            'success'
          );
          if (!result.success) {
            console.error('Failed to create notification for admin:', admin.id, result.error);
          }
        }
      }

      // Re-fetch charges
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: chgs } = await supabase.from('service_charges').select('*').eq('tenant_id', user.id);
        setCharges(chgs as ServiceCharge[] || []);
      }
      
      toast.success('Payment processed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process payment';
      console.error('Payment error:', errorMessage);
      toast.error('Failed to process payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const dashboardContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-6">
          <LoadingCard />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <LoadingCard key={i} />
            ))}
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <ErrorCard 
          title="Failed to load dashboard" 
          message={error}
          onRetry={() => window.location.reload()}
        />
      );
    }

    return (
      <div className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{documents.length}</div>
              <p className="text-xs text-muted-foreground">Total uploaded</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Outstanding
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${charges.filter(c => c.status !== 'paid').reduce((sum, c) => sum + c.amount, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {charges.filter(c => c.status !== 'paid').length} unpaid charges
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {requests.filter(r => r.status !== 'completed').length}
              </div>
              <p className="text-xs text-muted-foreground">Active requests</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Violations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{violations.length}</div>
              <p className="text-xs text-muted-foreground">Total violations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {notifications.filter(n => !n.is_read).length}
              </div>
              <p className="text-xs text-muted-foreground">Unread notifications</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Documents
              </CardTitle>
              <CardDescription>Upload lease agreements, receipts, and other documents</CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Upload Documents</DialogTitle>
                    <DialogDescription>
                      Upload your documents with enhanced file management
                    </DialogDescription>
                  </DialogHeader>
                  <EnhancedUploadService
                    bucket="documents"
                    onUploadComplete={() => {
                      setShowUploadDialog(false);
                      // Refresh documents
                      const refreshDocs = async () => {
                        const { data: { user } } = await supabase.auth.getUser();
                        if (user) {
                          const { data: docs } = await supabase.from('documents').select('*').eq('user_id', user.id);
                          setDocuments(docs as Document[] || []);
                        }
                      };
                      refreshDocs();
                    }}
                  />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Support Request
              </CardTitle>
              <CardDescription>Submit maintenance requests or general support tickets</CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={showMaintenanceForm} onOpenChange={setShowMaintenanceForm}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    New Request
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Submit Support Request</DialogTitle>
                    <DialogDescription>
                      Choose the type of support you need and describe your request
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Request Category</Label>
                      <Select value={selectedCategory} onValueChange={(value: 'maintenance' | 'general_support') => setSelectedCategory(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="maintenance">
                            <div className="flex items-center gap-2">
                              <Wrench className="h-4 w-4" />
                              Maintenance Support
                            </div>
                          </SelectItem>
                          <SelectItem value="general_support">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" />
                              General Support
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {selectedCategory === 'maintenance' 
                          ? 'For repairs, maintenance issues, and property-related problems'
                          : 'For general inquiries, account issues, and other support needs'
                        }
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Priority Level</Label>
                      <Select value={selectedPriority} onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => setSelectedPriority(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low - Can wait</SelectItem>
                          <SelectItem value="medium">Medium - Normal priority</SelectItem>
                          <SelectItem value="high">High - Important</SelectItem>
                          <SelectItem value="urgent">Urgent - Immediate attention needed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        ref={descriptionRef}
                        placeholder={selectedCategory === 'maintenance' 
                          ? "Describe the maintenance issue in detail..."
                          : "Describe your support request..."
                        }
                        className="min-h-[100px]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="image">Attach Photo (Optional)</Label>
                      <Input
                        ref={imageRef}
                        type="file"
                        accept="image/*"
                        className="cursor-pointer"
                      />
                    </div>
                    <Button 
                      onClick={handleSubmitRequest} 
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Request'
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowLocalServices(true)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Local Services
              </CardTitle>
              <CardDescription>Discover local services and amenities in your area</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => setShowLocalServices(true)}>
                <Eye className="h-4 w-4 mr-2" />
                View Services
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              My Documents
            </CardTitle>
            <CardDescription>View and manage your uploaded documents</CardDescription>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No documents uploaded"
                description="Upload your first document to get started"
                action={
                  <Button onClick={() => setShowUploadDialog(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{doc.file_path.split('/').pop()}</p>
                        <p className="text-sm text-gray-500">
                          Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={doc.status === 'accepted' ? 'success' : doc.status === 'rejected' ? 'destructive' : 'default'}
                      >
                        {doc.status}
                      </Badge>
                      {doc.reviewed_by && (
                        <p className="text-sm text-gray-500">Reviewed by: {doc.user_id || 'N/A'}</p>
                      )}
                      <Button variant="ghost" size="sm" asChild>
                        <a href={supabase.storage.from('documents').getPublicUrl(doc.file_path).data.publicUrl} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agreements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Agreements
            </CardTitle>
            <CardDescription>Review and sign your lease agreements</CardDescription>
          </CardHeader>
          <CardContent>
            {agreements.length === 0 ? (
              <EmptyState
                icon={User}
                title="No agreements"
                description="No agreements are currently available"
              />
            ) : (
              <div className="space-y-4">
                {agreements.map((agreement) => (
                  <div key={agreement.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant={agreement.signed ? 'default' : 'destructive'}>
                        {agreement.signed ? 'Signed' : 'Pending Signature'}
                      </Badge>
                      {agreement.signed && agreement.signed_at && (
                        <span className="text-sm text-gray-500">
                          Signed {new Date(agreement.signed_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="text-sm mb-3 line-clamp-3">{agreement.content}</p>
                    {!agreement.signed && (
                      <Button 
                        onClick={() => handleSignAgreement(agreement.id)}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Signing...
                          </>
                        ) : (
                          'Sign Agreement'
                        )}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service Charges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Service Charges
            </CardTitle>
            <CardDescription>View and pay your service charges</CardDescription>
          </CardHeader>
          <CardContent>
            {charges.length === 0 ? (
              <EmptyState
                icon={DollarSign}
                title="No charges"
                description="No service charges at this time"
              />
            ) : (
              <div className="space-y-4">
                {charges.map((charge) => (
                  <div key={charge.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge 
                        variant={charge.status === 'paid' ? 'default' : 'destructive'}
                      >
                        {charge.status}
                      </Badge>
                      <span className="text-lg font-semibold">${charge.amount}</span>
                    </div>
                    <p className="text-sm mb-2">
                      Due: {new Date(charge.due_date).toLocaleDateString()}
                    </p>
                    {charge.status !== 'paid' && (
                      <Button 
                        onClick={() => handlePayCharge(charge.id, charge.amount)}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Processing...
                          </>
                        ) : (
                          'Pay Now'
                        )}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Maintenance Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Support Requests
            </CardTitle>
            <CardDescription>Track your maintenance and support requests</CardDescription>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <EmptyState
                icon={Wrench}
                title="No support requests"
                description="Submit your first support request"
                action={
                  <Button onClick={() => setShowMaintenanceForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Request
                  </Button>
                }
              />
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge 
                        variant={
                          request.status === 'completed' ? 'default' :
                          request.status === 'in_progress' ? 'secondary' : 'destructive'
                        }
                      >
                        {request.status.replace('_', ' ')}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {new Date(request.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm mb-2">{request.description}</p>
                    {request.image_path && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Eye className="h-4 w-4" />
                        Photo attached
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Violations */}
        {violations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Violations
              </CardTitle>
              <CardDescription>Review any lease violations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {violations.map((violation) => (
                  <div key={violation.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="destructive">{violation.status}</Badge>
                      <span className="text-sm text-gray-500">
                        {new Date(violation.issued_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm">{violation.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Communication and Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>Stay updated with important announcements</CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationSystem />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <SimpleDashboardLayout currentRole="tenant">
      {showLocalServices ? (
        <div className="space-y-4">
          <Button 
            variant="outline" 
            onClick={() => setShowLocalServices(false)} 
            className="mb-4 hover:bg-gray-50"
          >
            ← Back to Dashboard
          </Button>
          <TenantLocalServices />
        </div>
      ) : (
        dashboardContent()
      )}
    </SimpleDashboardLayout>
  );
}
