"use client";
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
  Check, // For accept
  X // For reject
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Document, Profile } from '@/lib/supabase/types'; // Assuming Profile type exists for user info
import { useCreateNotification } from '@/components/notification-system';


import { LoadingSpinner, LoadingCard } from '@/components/ui/loading-spinner';
import { ErrorCard, EmptyState } from '@/components/ui/error-boundary';
import { toast } from 'sonner';

export function EnhancedAdminDashboardDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const { createNotification } = useCreateNotification();

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data: docs, error: docsError } = await supabase
        .from('documents')
          .select('*')

      if (docsError) throw docsError;
      console.log('Fetched documents:', docs);
      setDocuments(docs as Document[] || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load documents';
      console.error('Error fetching documents:', err);
      console.error('Error message:', errorMessage);
      setError(errorMessage);
      toast.error('Failed to load documents for admin dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDocumentAction = async (documentId: number, action: 'accepted' | 'rejected') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error: updateError } = await supabase
        .from('documents')
        .update({ status: action, reviewed_by: user.id })
        .eq('id', documentId);

      if (updateError) throw updateError;

      toast.success(`Document ${action} successfully`);
      fetchDocuments(); // Re-fetch documents to update status

      // Notify the tenant about the document status change
      const { data: document, error: docFetchError } = await supabase
        .from('documents')
        .select('user_id')
        .eq('id', documentId)
        .single();

      if (docFetchError) throw docFetchError;

      if (document?.user_id) {
        await createNotification(
          document.user_id,
          `Document ${action}`,
          `Your uploaded document has been ${action} by an administrator.`, // Customize message
          action === 'accepted' ? 'success' : 'alert' // Changed 'error' to 'alert' as per Notification type
        );
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to ${action} document`;
      console.error(`Error ${action} document:`, errorMessage);
      toast.error(`Failed to ${action} document`);
    }
  };

  if (isLoading) {
    return <LoadingCard />;
  }

  if (error) {
    return <ErrorCard title="Error Loading Documents" message={error} />;
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Document Management</h2>
        <p className="text-gray-600 mt-1">Review and manage uploaded documents from tenants</p>
      </div>
      
      {documents.length === 0 ? (
        <EmptyState
          title="No Documents Uploaded"
          description="There are no documents to review at the moment."
          icon={FileText}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {documents.map((doc) => {
            const fileName = doc.file_path.split('/').pop() || 'Unnamed Document';
            const formattedDate = new Date(doc.uploaded_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });
            
            return (
              <Card key={doc.id} className="overflow-hidden border border-gray-200">
                <div className="flex flex-col md:flex-row">
                  {/* Document Info Section */}
                  <div className="flex-grow p-4 md:p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-blue-50 p-2 rounded-md">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 truncate max-w-[200px]" title={fileName}>
                          Document: {fileName}
                        </h3>
                        <p className="text-sm text-gray-500">ID: {doc.id}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Uploaded by</p>
                        <p className="text-sm font-medium">{doc.user_id || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Uploaded on</p>
                        <p className="text-sm font-medium">{formattedDate}</p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">Status</p>
                      <Badge
                        className="font-medium"
                        variant={doc.status === 'accepted' ? 'success' : doc.status === 'rejected' ? 'destructive' : 'default'}
                      >
                        {doc.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Actions Section */}
                  <div className="bg-gray-50 p-4 md:p-6 flex md:flex-col justify-between items-center md:items-start gap-3 border-t md:border-t-0 md:border-l border-gray-200">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <a href={supabase.storage.from('documents').getPublicUrl(doc.file_path).data.publicUrl} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-4 w-4 mr-2" /> View
                      </a>
                    </Button>
                    
                    {doc.status === 'pending' && (
                      <div className="flex md:flex-col w-full gap-2">
                        <Button size="sm" className="w-full" onClick={() => handleDocumentAction(doc.id, 'accepted')}>
                          <Check className="h-4 w-4 mr-2" /> Accept
                        </Button>
                        <Button variant="destructive" size="sm" className="w-full" onClick={() => handleDocumentAction(doc.id, 'rejected')}>
                          <X className="h-4 w-4 mr-2" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}