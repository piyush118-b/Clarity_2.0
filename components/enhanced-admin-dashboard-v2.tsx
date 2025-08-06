'use client';

import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectSeparator } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  FileText,
  MapPin,
  Users,
  Upload,
  TrendingUp,
  Eye,
  X,
  ArrowUpRight,
  Filter,
  DollarSign,
  UserCheck,
  Clock,
  CheckCircle,
  Plus,
  Wrench,
  AlertTriangle,
  Send,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Paperclip,
  Info,
  User,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { MaintenanceRequest, ServiceCharge, Message, Agreement, Notification } from '@/lib/supabase/types';
import { SimpleDashboardLayout } from '@/components/simple-dashboard-layout';
import { LoadingSpinner, LoadingCard } from '@/components/ui/loading-spinner';
import { ErrorCard, EmptyState } from '@/components/ui/error-boundary';
import { toast } from 'sonner';
import { useCreateNotification } from '@/components/notification-system';
import { EnhancedAdminDashboardDocuments } from '@/components/enhanced-admin-dashboard-documents';
import EnhancedAdminLocalServices from '@/components/enhanced-admin-local-services';

export default function EnhancedAdminDashboardV2() {
  // UI State
  const [showDocumentManagement, setShowDocumentManagement] = useState(false);
  const [showLocalServices, setShowLocalServices] = useState(false);
  const [showDocumentAssign, setShowDocumentAssign] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showTenantDetailsDialog, setShowTenantDetailsDialog] = useState(false);

  // Form State
  const [warningTitle, setWarningTitle] = useState('');
  const [warningDescription, setWarningDescription] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDescription, setPaymentDescription] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentContent, setDocumentContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  
  // Initialize Gemini AI
  const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  
  // Data State
  const [pendingMaintenance, setPendingMaintenance] = useState<MaintenanceRequest[]>([]);
  const [unpaidCharges, setUnpaidCharges] = useState<ServiceCharge[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [serviceProviders, setServiceProviders] = useState<any[]>([]);
  const [selectedTenantForAction, setSelectedTenantForAction] = useState<any>(null);
  const [tenantPayments, setTenantPayments] = useState<any[]>([]);
  const [tenantCharges, setTenantCharges] = useState<any[]>([]);
  const [selectedChargeId, setSelectedChargeId] = useState<number | null>(null);
  
  const supabase = createClient();
  const { createNotification } = useCreateNotification();
  const [selectedTenantDetails, setSelectedTenantDetails] = useState<any>(null);
  const [tenantDetails, setTenantDetails] = useState<any[]>([]);
  const [isTenantManagementCollapsed, setIsTenantManagementCollapsed] = useState(false);
  const [isSupportRequestsCollapsed, setIsSupportRequestsCollapsed] = useState(false);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New UI state
  const [showAgreementUpload, setShowAgreementUpload] = useState(false);
  const [filterTenant, setFilterTenant] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  
  // Pagination state
  const [showAllTenants, setShowAllTenants] = useState(false);
  const [showAllMaintenance, setShowAllMaintenance] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  
  // Navigation functions
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  
  const handleCardClick = (type: 'messages' | 'charges' | 'maintenance' | 'documents' | 'local_services') => {
    switch (type) {
      case 'documents':
        setShowDocumentManagement(true);
        break;
      case 'local_services':
        setShowLocalServices(true);
        break;
      case 'charges':
        scrollToSection('unpaid-charges');
        break;
      case 'maintenance':
        scrollToSection('maintenance-requests');
        break;
    }
  };

  // OCR Processing Function
  const processDocumentWithGemini = async (file: File): Promise<string> => {
    try {
      const fileBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(fileBuffer);
      const base64String = btoa(String.fromCharCode(...uint8Array));
      
      const imagePart = {
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      };
      
      const prompt = "Extract all text content from this document word-for-word. Maintain the original formatting and structure as much as possible.";
      
      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error processing document with Gemini:', error);
      throw new Error('Failed to process document with OCR');
    }
  };

  const fetchTenantPayments = async (tenantId: string) => {
    try {
      if (!tenantId) {
        console.error('Error fetching tenant payments: No tenant ID provided');
        setTenantPayments([]);
        return;
      }

      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('payment_date', { ascending: false });
      
      if (error) {
        console.error('Supabase error fetching tenant payments:', error.message, error.details, error.hint);
        throw error;
      }
      
      console.log(`Successfully fetched ${data?.length || 0} payments for tenant ${tenantId}`);
      setTenantPayments(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Error fetching tenant payments: ${errorMessage}`, err);
      setTenantPayments([]);
    }
  };

  const fetchTenantCharges = async (tenantId: string) => {
    try {
      if (!tenantId) {
        console.error('Error fetching tenant charges: No tenant ID provided');
        setTenantCharges([]);
        return;
      }
      
      console.log('Fetching charges for tenant:', tenantId);
      const { data, error } = await supabase
        .from('service_charges')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('due_date', { ascending: false });
      
      if (error) {
        console.error('Supabase error fetching tenant charges:', error.message, error.details, error.hint);
        throw error;
      }
      
      console.log('Tenant charges fetched:', data?.length || 0, 'charges found');
      setTenantCharges(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Error fetching tenant charges: ${errorMessage}`, err);
      setTenantCharges([]);
    }
  };

  // Function to fetch maintenance requests only
  const fetchMaintenanceRequests = async () => {
    try {
      const { data, error } = await supabase.from('maintenance_requests')
        .select('*')
        .in('status', ['pending', 'assigned', 'in_progress', 'completed']);
        
      if (error) throw error;
      
      // Check if there are any updates compared to current state
      const hasUpdates = checkForUpdates(data as MaintenanceRequest[] || [], pendingMaintenance);
      
      if (hasUpdates) {
        setPendingMaintenance(data as MaintenanceRequest[] || []);
        
        // If the selected request is updated, refresh it
        if (selectedRequest) {
          const updatedRequest = data?.find(r => r.id === selectedRequest.id);
          if (updatedRequest && JSON.stringify(updatedRequest) !== JSON.stringify(selectedRequest)) {
            setSelectedRequest(updatedRequest as MaintenanceRequest);
            toast.info('Support request information has been updated');
          }
        }
      }
      
      return data;
    } catch (err) {
      console.error('Error fetching maintenance requests:', err);
      return null;
    }
  };
  
  // Helper function to check if there are updates to maintenance requests
  const checkForUpdates = (newData: MaintenanceRequest[], oldData: MaintenanceRequest[]) => {
    if (newData.length !== oldData.length) return true;
    
    // Create maps for faster lookup
    const oldMap = new Map(oldData.map(item => [item.id, item]));
    
    // Check if any item has been updated
    for (const newItem of newData) {
      const oldItem = oldMap.get(newItem.id);
      
      // If item doesn't exist in old data or has different status/updated_at
      if (!oldItem || 
          oldItem.status !== newItem.status || 
          oldItem.updated_at !== newItem.updated_at ||
          oldItem.assigned_to !== newItem.assigned_to) {
        return true;
      }
    }
    
    return false;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [maintResult, chargesResult, tenantsResult, providersResult] = await Promise.all([
          supabase.from('maintenance_requests')
            .select('*')
            .in('status', ['pending', 'assigned', 'in_progress', 'completed']),
          supabase.from('service_charges').select('*').eq('status', 'unpaid'),
          supabase.from('profiles').select('*').eq('role', 'tenant'),
          supabase.from('profiles').select('id').eq('role', 'service_provider'),
        ]);

        // Check for errors
        if (chargesResult.error) throw chargesResult.error;
        if (tenantsResult.error) throw tenantsResult.error;
        if (providersResult.error) throw providersResult.error;

        // Set data
        setPendingMaintenance(maintResult.data as MaintenanceRequest[] || []);
        setUnpaidCharges(chargesResult.data as ServiceCharge[] || []);
        setTenants(tenantsResult.data || []);
        setTenantDetails(tenantsResult.data || []);
        setServiceProviders(providersResult.data || []);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
        console.error('Error fetching data:', errorMessage);
        setError(errorMessage);
        toast.error('Failed to load admin dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    
    // Set up polling for maintenance request updates every 30 seconds
    const pollingInterval = setInterval(() => {
      fetchMaintenanceRequests();
    }, 30000); // 30 seconds
    
    return () => clearInterval(pollingInterval);
  }, []);

  // Handle assignment of maintenance requests
  const handleAssignMaintenance = async (requestId: number, providerId: string) => {
    try {
      const request = pendingMaintenance.find(r => r.id === requestId);
      if (!request) {
        toast.error('Request not found');
        return;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('maintenance_requests')
        .update({ 
          assigned_to: providerId,
          assigned_by: user?.email || 'Admin',
          assigned_at: new Date().toISOString(),
          status: 'assigned',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      // Update local state
      setPendingMaintenance(prevRequests =>
        prevRequests.map(req =>
          req.id === requestId
            ? { 
                ...req, 
                assigned_to: providerId, 
                assigned_by: user?.email || 'Admin',
                assigned_at: new Date().toISOString(),
                status: 'assigned', 
                updated_at: new Date().toISOString() 
              }
            : req
        )
      );

      // If this is the currently selected request, update it
      if (selectedRequest && selectedRequest.id === requestId) {
        setSelectedRequest({
          ...selectedRequest,
          assigned_to: providerId,
          assigned_by: user?.email || 'Admin',
          assigned_at: new Date().toISOString(),
          status: 'assigned',
          updated_at: new Date().toISOString()
        });
      }

      toast.success('Request assigned successfully');
    } catch (err) {
      console.error('Error assigning request:', err);
      toast.error('Failed to assign request');
    }
  };

  // Function to handle updating request status
  const handleUpdateRequestStatus = async (requestId: number, newStatus: string) => {
    try {
      setIsLoading(true);
      const request = pendingMaintenance.find(r => r.id === requestId);
      if (!request) throw new Error('Request not found');

      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('maintenance_requests')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString(),
          // If status is changing to in_progress and there's no assigned_to yet,
          // assign it to the current user
          ...(newStatus === 'in_progress' && !request.assigned_to ? {
            assigned_to: user?.email || 'Admin',
            assigned_by: user?.email || 'Admin',
            assigned_at: new Date().toISOString()
          } : {})
        })
        .eq('id', requestId);

      if (error) throw error;

      // Create notification for tenant if there is one
      if (request.tenant_id) {
        await createNotification(
          request.tenant_id, 
          'Support Request Update', 
          `Your request status is now: ${newStatus.replace('_', ' ')}`, 
          'info'
        );
      }

      // Update local state
      setPendingMaintenance(prevRequests => 
        prevRequests.map(r => 
          r.id === requestId ? { 
            ...r, 
            status: newStatus, 
            updated_at: new Date().toISOString(),
            ...(newStatus === 'in_progress' && !r.assigned_to ? {
              assigned_to: user?.email || 'Admin',
              assigned_by: user?.email || 'Admin',
              assigned_at: new Date().toISOString()
            } : {})
          } : r
        )
      );
      
      // If this is the currently selected request, update it
      if (selectedRequest && selectedRequest.id === requestId) {
        setSelectedRequest({
          ...selectedRequest,
          status: newStatus,
          updated_at: new Date().toISOString(),
          ...(newStatus === 'in_progress' && !selectedRequest.assigned_to ? {
            assigned_to: user?.email || 'Admin',
            assigned_by: user?.email || 'Admin',
            assigned_at: new Date().toISOString()
          } : {})
        });
      }
      
      toast.success('Request status updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update status';
      toast.error(errorMessage);
      console.error('Status update error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignDocument = async () => {
    if (!selectedTenantForAction || !selectedFile) {
      toast.error('Please select a tenant and upload a file');
      return;
    }

    try {
      setIsSubmitting(true);
      setIsProcessingOCR(true);
      
      // Upload file to Supabase storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `documents/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile);
      
      if (uploadError) throw uploadError;
      
      // Process document with Gemini OCR for PDF and image files
      let documentOCR = '';
      const supportedOCRTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      
      if (supportedOCRTypes.includes(selectedFile.type)) {
        try {
          documentOCR = await processDocumentWithGemini(selectedFile);
        } catch (ocrError) {
          console.error('OCR processing failed:', ocrError);
          toast.error('OCR processing failed, but document was uploaded');
        }
      }
      
      setIsProcessingOCR(false);
      
      // Insert document record into database
      const { error: dbError } = await supabase.from('documents').insert({
        user_id: selectedTenantForAction.id,
        file_path: filePath,
        status: 'pending',
        document_ocr: documentOCR
      });
      
      if (dbError) throw dbError;

      // Create notification for tenant
      const result = await createNotification(
        selectedTenantForAction.id,
        'New Document Assigned',
        `A new document has been assigned to you. Please review it in your dashboard.`,
        'info'
      );
      if (!result.success) {
        console.error('Failed to create notification for tenant:', selectedTenantForAction.id, result.error);
      }

      // Reset form
      setDocumentTitle('');
      setDocumentContent('');
      setSelectedFile(null);
      setSelectedTenantForAction(null);
      setShowDocumentAssign(false);
      
      toast.success('Document assigned and processed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign document';
      console.error('Document assignment error:', errorMessage);
      toast.error('Failed to assign document');
    } finally {
      setIsSubmitting(false);
      setIsProcessingOCR(false);
    }
  };

  const handleCreateWarning = async () => {
    if (!selectedTenantForAction || !warningTitle.trim() || !warningDescription.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Create violation record
      await supabase.from('violations').insert({
        tenant_id: selectedTenantForAction.id,
        description: `${warningTitle}: ${warningDescription}`,
        status: 'active'
      });

      // Create warning notification
      const result = await createNotification(
        selectedTenantForAction.id,
        `Warning: ${warningTitle}`,
        warningDescription,
        'warning'
      );
      if (!result.success) {
        console.error('Failed to create notification for tenant:', selectedTenantForAction.id, result.error);
      }

      // Reset form
      setWarningTitle('');
      setWarningDescription('');
      setSelectedTenantForAction(null);
      setShowWarningDialog(false);
      
      toast.success('Warning issued successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create warning';
      console.error('Warning creation error:', errorMessage);
      toast.error('Failed to create warning');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedTenantForAction || !paymentAmount.trim() || !paymentDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('Recording payment with the following details:');
      console.log('- Amount:', amount);
      console.log('- Date:', paymentDate);
      console.log('- Charge ID:', selectedChargeId);
      console.log('- Description:', paymentDescription);
      
      // Record payment in database according to the schema
      const { data: paymentData, error: paymentError } = await supabase.from('payments').insert({
        charge_id: selectedChargeId, // This can be null if no charge is selected
        amount: amount,
        payment_date: paymentDate,
        status: 'completed'
      }).select();

      if (paymentError) {
        console.error('Database error details:', paymentError);
        throw paymentError;
      }

      console.log('Payment recorded successfully:', paymentData);
      
      // If this payment is linked to a charge, update the charge status
      if (selectedChargeId) {
        const { error: chargeUpdateError } = await supabase
          .from('service_charges')
          .update({ status: 'paid' })
          .eq('id', selectedChargeId);
          
        if (chargeUpdateError) {
          console.error('Error updating charge status:', chargeUpdateError);
          // Continue execution even if charge update fails
        } else {
          console.log('Charge status updated to paid');
        }
      }

      // Create notification for tenant
      const notificationMessage = selectedChargeId
        ? `A payment of £${amount.toFixed(2)} has been recorded for charge #${selectedChargeId}`
        : `A payment of £${amount.toFixed(2)} has been recorded${paymentDescription ? ': ' + paymentDescription : ''}`;
        
      const result = await createNotification(
        selectedTenantForAction.id,
        'Payment Recorded',
        notificationMessage,
        'info'
      );
      
      if (!result.success) {
        console.error('Failed to create notification for tenant:', selectedTenantForAction.id, result.error);
      }

      // Reset form
      setPaymentAmount('');
      setPaymentDate('');
      setPaymentDescription('');
      setSelectedChargeId(null);
      setSelectedTenantForAction(null);
      setShowPaymentDialog(false);
      
      // Refresh tenant charges and payments
      if (selectedTenantForAction?.id) {
        fetchTenantCharges(selectedTenantForAction.id);
        fetchTenantPayments(selectedTenantForAction.id);
      }
      
      toast.success('Payment recorded successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to record payment';
      console.error('Payment recording error:', errorMessage);
      toast.error('Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };



  // Calculate overview stats from real data
  const overviewStats = {
    unpaidCharges: unpaidCharges.length,
    pendingMaintenance: pendingMaintenance.length,
    totalTenants: tenants.length,
  };

    // Render loading state if data is still loading
    if (isLoading) {
      return (
        <SimpleDashboardLayout currentRole="admin">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <LoadingCard key={i} />
              ))}
            </div>
            <LoadingCard />
            <LoadingCard />
          </div>
        </SimpleDashboardLayout>
      );
    }

    // Render error state if there was an error loading data
    if (error) {
      return (
        <SimpleDashboardLayout currentRole="admin">
          <ErrorCard 
            title="Failed to load admin dashboard" 
            message={error}
            onRetry={() => window.location.reload()}
          />
        </SimpleDashboardLayout>
      );
    }
    
    // Main dashboard content
    return (
      <SimpleDashboardLayout currentRole="admin">
        <div className="space-y-6">
          {/* Admin Dashboard Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleCardClick('documents')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Document Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Manage Documents</div>
              <p className="text-xs text-muted-foreground">Review and manage uploaded documents.</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleCardClick('charges')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Unpaid Charges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overviewStats.unpaidCharges}</div>
              <p className="text-xs text-red-600">Requires attention</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleCardClick('maintenance')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overviewStats.pendingMaintenance}</div>
              <p className="text-xs text-muted-foreground">Awaiting assignment</p>
            </CardContent>
          </Card>



          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleCardClick('local_services')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Local Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Manage Services</div>
              <p className="text-xs text-muted-foreground">Add and manage local services</p>
            </CardContent>
          </Card>
        </div>

        {/* Tenant Management Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Tenant Management
                </CardTitle>
                <CardDescription>View and manage tenant information</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsTenantManagementCollapsed(!isTenantManagementCollapsed)}
                className="flex items-center gap-1"
              >
                {isTenantManagementCollapsed ? (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    <span className="text-sm">Expand</span>
                  </>
                ) : (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    <span className="text-sm">Collapse</span>
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          {!isTenantManagementCollapsed && (
            <CardContent>
              <div className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Tenants</span>
                    <Badge variant="secondary">{tenants.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Support Worker</span>
                    <Badge variant="secondary">{serviceProviders.length}</Badge>
                  </div>
                </div>
                
                {/* Detailed Tenant List */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Tenant Details</h4>
                  {tenantDetails.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No tenants found</p>
                  ) : (
                    <div className="space-y-3">
                      {(showAllTenants ? tenantDetails : tenantDetails.slice(0, 5)).map((tenant) => (
                        <div 
                          key={tenant.id} 
                          className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={async () => {
                            setSelectedTenantForAction(tenant);
                            setSelectedTenantDetails(tenant);
                            setShowTenantDetailsDialog(true);
                            await fetchTenantPayments(tenant.id);
                            await fetchTenantCharges(tenant.id);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium text-sm">{tenant.full_name || 'Unnamed Tenant'}</h5>
                              <p className="text-xs text-gray-500">{tenant.email}</p>
                              <p className="text-xs text-gray-400">ID: {tenant.id}</p>
                            </div>
                            <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTenantForAction(tenant);
                                  setShowDocumentAssign(true);
                                }}
                                className="h-7 text-xs px-2"
                              >
                                <FileText className="h-3 w-3 mr-1" />
                                Doc
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTenantForAction(tenant);
                                  setShowWarningDialog(true);
                                }}
                                className="h-7 text-xs px-2"
                              >
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Warn
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  setSelectedTenantForAction(tenant);
                                  setPaymentAmount('');
                                  setPaymentDescription('');
                                  setPaymentDate(new Date().toISOString().split('T')[0]);
                                  setSelectedChargeId(null);
                                  
                                  // Fetch tenant charges before showing the dialog
                                  await fetchTenantCharges(tenant.id);
                                  await fetchTenantPayments(tenant.id);
                                  
                                  setShowPaymentDialog(true);
                                }}
                                className="h-7 text-xs px-2"
                              >
                                <DollarSign className="h-3 w-3 mr-1" />
                                Pay
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Show More/Less Button */}
                      {tenantDetails.length > 5 && (
                        <div className="flex justify-center pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAllTenants(!showAllTenants)}
                            className="flex items-center gap-2"
                          >
                            {showAllTenants ? (
                              <>
                                Show Less
                                <ChevronUp className="h-3 w-3" />
                              </>
                            ) : (
                              <>
                                See More ({tenantDetails.length - 5} more)
                                <ChevronDown className="h-3 w-3" />
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          )}
        </Card>



        {/* Document Assignment Dialog */}
        <Dialog open={showDocumentAssign} onOpenChange={setShowDocumentAssign}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Document to {selectedTenantForAction?.full_name}</DialogTitle>
              <DialogDescription>
                Upload and assign a document to this tenant with OCR processing
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="document-attachment">Document File</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="document-attachment"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                    className="flex-1"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Check file size (10MB limit)
                        if (file.size > 10 * 1024 * 1024) {
                          toast.error('File size must be less than 10MB');
                          e.target.value = '';
                          return;
                        }
                        setSelectedFile(file);
                      }
                    }}
                  />
                  <Button type="button" variant="outline" size="sm">
                    <Paperclip className="h-4 w-4 mr-1" />
                    Browse
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG (max 10MB)
                </p>
                {selectedFile && (
                  <p className="text-sm text-green-600 mt-2">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>
              
              {isProcessingOCR && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    <span className="text-sm text-blue-700">Processing document with Gemini OCR...</span>
                  </div>
                </div>
              )}
              
              <Button 
                onClick={handleAssignDocument} 
                className="w-full"
                disabled={isSubmitting || !selectedFile || !selectedTenantForAction}
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    {isProcessingOCR ? 'Processing OCR...' : 'Assigning...'}
                  </>
                ) : (
                  'Assign Document'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Tenant Details Dialog */}
        <Dialog open={showTenantDetailsDialog} onOpenChange={setShowTenantDetailsDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Tenant Profile</DialogTitle>
              <DialogDescription>
                Complete tenant information and onboarding details.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 max-h-[70vh] overflow-auto">
              {selectedTenantDetails && (
                <>
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                        <p className="text-sm">{selectedTenantDetails.full_name || 'Not provided'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                        <p className="text-sm">{selectedTenantDetails.email || 'Not provided'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Phone Number</Label>
                        <p className="text-sm">{selectedTenantDetails.phone_number || 'Not provided'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Role</Label>
                        <Badge variant="secondary" className="capitalize">{selectedTenantDetails.role}</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Address</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Address Line 1</Label>
                        <p className="text-sm">{selectedTenantDetails.address_line1 || 'Not provided'}</p>
                      </div>
                      {selectedTenantDetails.address_line2 && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Address Line 2</Label>
                          <p className="text-sm">{selectedTenantDetails.address_line2}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">City</Label>
                          <p className="text-sm">{selectedTenantDetails.city || 'Not provided'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Postcode</Label>
                          <p className="text-sm">{selectedTenantDetails.postcode || 'Not provided'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Country</Label>
                          <p className="text-sm">{selectedTenantDetails.country || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Housing Status */}
                  {selectedTenantDetails.housing_status && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">Housing Status</h3>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Current Status</Label>
                        <Badge variant="outline" className="capitalize ml-2">{selectedTenantDetails.housing_status.replace('_', ' ')}</Badge>
                      </div>
                    </div>
                  )}

                  {/* Support Services */}
                  {selectedTenantDetails.selected_supports && selectedTenantDetails.selected_supports.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">Support Services</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedTenantDetails.selected_supports.map((support: string, index: number) => (
                          <Badge key={index} variant="secondary">{support}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Outstanding Charges */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Outstanding Charges</h3>
                    {tenantCharges.filter(charge => charge.status === 'unpaid').length === 0 ? (
                      <p className="text-sm text-green-600">No outstanding charges</p>
                    ) : (
                      <div className="space-y-3">
                        {tenantCharges.filter(charge => charge.status === 'unpaid').map((charge) => (
                          <div key={charge.id} className="border rounded-lg p-3 bg-red-50">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="destructive">{charge.status}</Badge>
                              <span className="text-sm font-medium text-red-600">£{charge.amount}</span>
                            </div>
                            <p className="text-sm">{charge.description || 'Service charge'}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Due: {new Date(charge.due_date).toLocaleDateString()}
                              {new Date(charge.due_date) < new Date() && (
                                <span className="text-red-600 ml-2 font-medium">OVERDUE</span>
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Payment History */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Payment History</h3>
                    {tenantPayments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No payment records found</p>
                    ) : (
                      <div className="space-y-3 max-h-[200px] overflow-y-auto">
                        {tenantPayments.map((payment) => (
                          <div key={payment.id} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant={payment.payment_type === 'payment' ? 'default' : payment.payment_type === 'refund' ? 'secondary' : 'destructive'}>
                                  {payment.payment_type}
                                </Badge>
                                <Badge variant={payment.status === 'completed' ? 'default' : payment.status === 'pending' ? 'secondary' : 'destructive'}>
                                  {payment.status}
                                </Badge>
                              </div>
                              <span className="text-sm font-medium">£{payment.amount}</span>
                            </div>
                            <p className="text-sm">{payment.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(payment.payment_date).toLocaleDateString()} • 
                              Recorded {new Date(payment.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Account Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Account Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Account Created</Label>
                        <p className="text-sm">{new Date(selectedTenantDetails.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Tenant ID</Label>
                        <p className="text-xs font-mono text-muted-foreground">{selectedTenantDetails.id}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setShowTenantDetailsDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Warning Dialog */}
        <Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Issue Warning to {selectedTenantForAction?.full_name}</DialogTitle>
              <DialogDescription>
                Create a warning or violation notice for this tenant
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="warning-title">Warning Title</Label>
                <Input
                  id="warning-title"
                  value={warningTitle}
                  onChange={(e) => setWarningTitle(e.target.value)}
                  placeholder="Enter warning title"
                />
              </div>
              <div>
                <Label htmlFor="warning-description">Warning Description</Label>
                <Textarea
                  id="warning-description"
                  value={warningDescription}
                  onChange={(e) => setWarningDescription(e.target.value)}
                  placeholder="Enter warning details"
                  className="min-h-[150px]"
                />
              </div>
              <Button 
                onClick={handleCreateWarning} 
                className="w-full"
                disabled={isSubmitting || !warningTitle || !warningDescription}
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Issuing...
                  </>
                ) : (
                  'Issue Warning'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Payment Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Payment - {selectedTenantForAction?.full_name}</DialogTitle>
              <DialogDescription>
                Record a payment received from this tenant
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="payment-amount">Amount ($)</Label>
                <Input
                  id="payment-amount"
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="payment-description">Description</Label>
                <Input
                  id="payment-description"
                  value={paymentDescription}
                  onChange={(e) => setPaymentDescription(e.target.value)}
                  placeholder="e.g., Rent for June 2023"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="payment-date">Payment Date</Label>
                <Input
                  id="payment-date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPaymentDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={async () => {
                    try {
                      setIsSubmitting(true);
                      // TODO: Implement payment recording logic
                      console.log('Recording payment:', {
                        tenantId: selectedTenantForAction?.id,
                        amount: parseFloat(paymentAmount),
                        description: paymentDescription,
                        date: paymentDate
                      });
                      
                      // Show success message
                      toast.success('Payment recorded successfully');
                      
                      // Reset form and close dialog
                      setPaymentAmount('');
                      setPaymentDescription('');
                      setShowPaymentDialog(false);
                    } catch (error) {
                      console.error('Error recording payment:', error);
                      toast.error('Failed to record payment');
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  disabled={isSubmitting || !paymentAmount || !paymentDate}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? 'Recording...' : 'Record Payment'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Support Requests */}
        <Card id="maintenance-requests">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Support Requests
                </CardTitle>
                <CardDescription>Manage maintenance and general support requests</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSupportRequestsCollapsed(!isSupportRequestsCollapsed)}
                className="flex items-center gap-1"
              >
                {isSupportRequestsCollapsed ? (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    <span className="text-sm">Expand</span>
                  </>
                ) : (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    <span className="text-sm">Collapse</span>
                  </>
                )}
              </Button>
            </div>
            
            {/* Filters */}
            {!isSupportRequestsCollapsed && (
              <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Label>Category:</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="general_support">General Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Label>Priority:</Label>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Label>Status:</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              </div>
            )}
          </CardHeader>
          {!isSupportRequestsCollapsed && (
            <CardContent>
            {(() => {
              // Filter requests based on selected filters
              let filteredRequests = pendingMaintenance;
              
              if (filterCategory !== 'all') {
                filteredRequests = filteredRequests.filter(r => r.category === filterCategory);
              }
              
              if (filterPriority !== 'all') {
                filteredRequests = filteredRequests.filter(r => r.priority === filterPriority);
              }
              
              if (filterStatus !== 'all') {
                filteredRequests = filteredRequests.filter(r => r.status === filterStatus);
              }
              
              if (filteredRequests.length === 0) {
                return (
                  <EmptyState
                    icon={Wrench}
                    title="No support requests found"
                    description="No requests match the current filters or all requests have been completed"
                  />
                );
              }
              
              return (
                <>
                  <div className="space-y-4">
                    {(showAllMaintenance ? filteredRequests : filteredRequests.slice(0, 5)).map((request) => (
                      <div key={request.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline">{request.status.replace('_', ' ')}</Badge>
                            <Badge variant={request.category === 'maintenance' ? 'default' : 'secondary'}>
                              {request.category === 'maintenance' ? 'Maintenance' : 'General Support'}
                            </Badge>
                            <Badge variant={
                              request.priority === 'urgent' ? 'destructive' :
                              request.priority === 'high' ? 'destructive' :
                              request.priority === 'medium' ? 'default' : 'secondary'
                            }>
                              {request.priority?.charAt(0).toUpperCase() + request.priority?.slice(1) || 'Medium'}
                            </Badge>
                            {request.assigned_to && (
                              <Badge variant="outline">Assigned to: {request.assigned_to}</Badge>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(request.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm font-medium">{request.description}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {!request.assigned_to && (
                            <Select onValueChange={(value) => handleAssignMaintenance(request.id, value)}>
                              <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder={request.category === 'maintenance' ? 'Assign to provider' : 'Assign to staff'} />
                              </SelectTrigger>
                              <SelectContent>
                                {serviceProviders.map((provider) => (
                                  <SelectItem key={provider.id} value={provider.id}>
                                    {provider.id}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedRequest(request);
                              setIsRequestModalOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" /> View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {filteredRequests.length > 5 && (
                    <div className="flex justify-center pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowAllMaintenance(!showAllMaintenance)}
                        className="flex items-center gap-2"
                      >
                        {showAllMaintenance ? (
                          <>
                            Show Less
                            <ArrowUpRight className="h-4 w-4 rotate-180" />
                          </>
                        ) : (
                          <>
                            See More ({filteredRequests.length - 5} more)
                            <ArrowUpRight className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              );
            })()}
            </CardContent>
          )}
        </Card>

        {/* Unpaid Service Charges */}
        <Card id="unpaid-service-charges">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Unpaid Service Charges
            </CardTitle>
            <CardDescription>Monitor outstanding payments</CardDescription>
          </CardHeader>
          <CardContent>
            {unpaidCharges.length === 0 ? (
              <EmptyState
                icon={DollarSign}
                title="No unpaid charges"
                description="All service charges have been paid"
              />
            ) : (
              <div className="space-y-4">
                {unpaidCharges.map((charge) => (
                  <div key={charge.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="destructive">{charge.status}</Badge>
                      <span className="text-sm font-medium">${charge.amount}</span>
                    </div>
                    <p className="text-sm mb-2">Due: {new Date(charge.due_date).toLocaleDateString()}</p>
                    <p className="text-xs text-muted-foreground">Tenant: {charge.tenant_id}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Dialog */}
      <Dialog 
        open={showPaymentDialog} 
        onOpenChange={(open) => {
          setShowPaymentDialog(open);
          if (!open) {
            // Reset all form fields when dialog is closed
            setPaymentAmount('');
            setPaymentDate('');
            setPaymentDescription('');
            setSelectedChargeId(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment for {selectedTenantForAction?.full_name}</DialogTitle>
            <DialogDescription>
              Record a payment made by or to this tenant
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment-amount">Amount (£)</Label>
                <Input
                  id="payment-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-date">Date</Label>
                <Input
                  id="payment-date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="charge-selection">Related Charge (Optional)</Label>
              <Select 
                onValueChange={(value) => setSelectedChargeId(value ? parseInt(value) : null)}
                value={selectedChargeId?.toString() || ""}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a charge (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None (Manual Payment)</SelectItem>
                  {tenantCharges.map((charge) => (
                    <SelectItem key={charge.id} value={charge.id.toString()}>
                      {charge.description} - £{charge.amount.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">Linking a payment to a charge will help with payment tracking</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-description">Description</Label>
              <Textarea
                id="payment-description"
                value={paymentDescription}
                onChange={(e) => setPaymentDescription(e.target.value)}
                placeholder="Enter payment description (e.g., Rent for July 2023)"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPaymentDialog(false);
                  setPaymentAmount('');
                  setPaymentDate('');
                  setPaymentDescription('');
                  setSelectedChargeId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRecordPayment}
                disabled={!paymentAmount || !paymentDate || isSubmitting}
              >
                {isSubmitting ? 'Recording...' : 'Record Payment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Document Management Dialog */}
      <Dialog open={showDocumentManagement} onOpenChange={setShowDocumentManagement}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>Document Management</DialogTitle>
            <DialogDescription>
              Review and manage tenant documents
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <EnhancedAdminDashboardDocuments />
          </div>
          <DialogFooter className="px-6 py-4 border-t">
            <Button variant="outline" onClick={() => setShowDocumentManagement(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Local Services Dialog */}
      <Dialog open={showLocalServices} onOpenChange={setShowLocalServices}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Local Services</DialogTitle>
            <DialogDescription>
              Add and manage local services for your tenants
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <EnhancedAdminLocalServices />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLocalServices(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Support Request Details Dialog */}
      <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Support Request Details</DialogTitle>
            <DialogDescription>
              View complete information and status history
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              {/* Request Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Request ID</h3>
                  <p className="mt-1">{selectedRequest.id}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Created On</h3>
                  <p className="mt-1">{new Date(selectedRequest.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Category</h3>
                  <p className="mt-1">
                    <Badge variant={selectedRequest.category === 'maintenance' ? 'default' : 'secondary'}>
                      {selectedRequest.category === 'maintenance' ? 'Maintenance' : 'General Support'}
                    </Badge>
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Priority</h3>
                  <p className="mt-1">
                    <Badge variant={
                      selectedRequest.priority === 'urgent' ? 'destructive' :
                      selectedRequest.priority === 'high' ? 'destructive' :
                      selectedRequest.priority === 'medium' ? 'default' : 'secondary'
                    }>
                      {selectedRequest.priority?.charAt(0).toUpperCase() + selectedRequest.priority?.slice(1) || 'Medium'}
                    </Badge>
                  </p>
                </div>
                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <p className="mt-1">{selectedRequest.description}</p>
                </div>
              </div>
              
              {/* Status Information */}
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Current Status</h3>
                <div className="flex items-center gap-3 mb-4">
                  <Badge className="text-sm px-3 py-1" variant={
                    selectedRequest.status === 'completed' ? 'outline' :
                    selectedRequest.status === 'in_progress' ? 'default' :
                    selectedRequest.status === 'assigned' ? 'secondary' : 'outline'
                  }>
                    {selectedRequest.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                  
                  {selectedRequest.updated_at && selectedRequest.updated_at !== selectedRequest.created_at && (
                    <span className="text-sm text-gray-500">
                      Last updated: {new Date(selectedRequest.updated_at).toLocaleString()}
                    </span>
                  )}
                </div>
                
                {/* Assignment Information */}
                {selectedRequest.assigned_to && (
                  <div className="bg-gray-50 p-3 rounded-md mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Assigned To:</span> 
                      <span>{selectedRequest.assigned_to}</span>
                    </div>
                    
                    {selectedRequest.assigned_by && (
                      <div className="text-sm text-gray-500 mt-1 ml-6">
                        Assigned by: {selectedRequest.assigned_by}
                        {selectedRequest.assigned_at && (
                          <> on {new Date(selectedRequest.assigned_at).toLocaleString()}</>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Status Timeline */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-medium mb-3">Status Timeline</h3>
                  <div className="space-y-3">
                    {/* Always show creation as first event */}
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 p-1 rounded-full mt-0.5">
                        <Clock className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Request Created</p>
                        <p className="text-xs text-gray-500">{new Date(selectedRequest.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    
                    {/* Show assignment if available */}
                    {selectedRequest.assigned_to && selectedRequest.assigned_at && (
                      <div className="flex items-start gap-3">
                        <div className="bg-purple-100 p-1 rounded-full mt-0.5">
                          <Users className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Assigned to {selectedRequest.assigned_to}</p>
                          <p className="text-xs text-gray-500">{new Date(selectedRequest.assigned_at).toLocaleString()}</p>
                          {selectedRequest.assigned_by && (
                            <p className="text-xs text-gray-500">by {selectedRequest.assigned_by}</p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Show in progress if that's the current status */}
                    {selectedRequest.status === 'in_progress' && selectedRequest.updated_at && (
                      <div className="flex items-start gap-3">
                        <div className="bg-amber-100 p-1 rounded-full mt-0.5">
                          <Wrench className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Work In Progress</p>
                          <p className="text-xs text-gray-500">{new Date(selectedRequest.updated_at).toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Show completed if that's the current status */}
                    {selectedRequest.status === 'completed' && selectedRequest.updated_at && (
                      <div className="flex items-start gap-3">
                        <div className="bg-green-100 p-1 rounded-full mt-0.5">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Request Completed</p>
                          <p className="text-xs text-gray-500">{new Date(selectedRequest.updated_at).toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <DialogFooter className="flex flex-col sm:flex-row gap-2 items-start">
                <div className="flex flex-wrap gap-2 mr-auto">
                  {/* Status Update Buttons - Only show relevant status transitions */}
                  {selectedRequest.status !== 'in_progress' && selectedRequest.status !== 'completed' && (
                    <Button 
                      size="sm" 
                      variant="default"
                      className="bg-amber-500 hover:bg-amber-600"
                      onClick={() => handleUpdateRequestStatus(selectedRequest.id, 'in_progress')}
                    >
                      <Wrench className="mr-1 h-4 w-4" /> Mark In Progress
                    </Button>
                  )}
                  
                  {selectedRequest.status !== 'completed' && (
                    <Button 
                      size="sm" 
                      variant="default"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleUpdateRequestStatus(selectedRequest.id, 'completed')}
                    >
                      <CheckCircle className="mr-1 h-4 w-4" /> Mark Completed
                    </Button>
                  )}
                  
                  {selectedRequest.status === 'completed' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleUpdateRequestStatus(selectedRequest.id, 'in_progress')}
                    >
                      <Wrench className="mr-1 h-4 w-4" /> Reopen as In Progress
                    </Button>
                  )}
                </div>
                
                <Button variant="outline" onClick={() => setIsRequestModalOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SimpleDashboardLayout>
  );
}
