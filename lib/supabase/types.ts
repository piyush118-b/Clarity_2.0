export interface Role {
  id: number;
  name: string;
}

export interface Profile {
  id: string;
  role_id: number;
  service_interests?: string[];
}

export interface Document {
  id: number;
  user_id: string;
  file_path: string;
  status: 'pending' | 'accepted' | 'rejected' | 'uploaded';
  uploaded_at: string;
  reviewed_by?: string | null;

}

export interface Agreement {
  id: number;
  tenant_id: string;
  content: string;
  signed: boolean;
  signed_at: string | null;
}

export interface Violation {
  id: number;
  tenant_id: string;
  description: string;
  issued_at: string;
  status: string;
}

export interface ServiceCharge {
  id: number;
  tenant_id: string;
  amount: number;
  due_date: string;
  status: string;
  created_at: string;
}

export interface Payment {
  id: number;
  charge_id: number;
  amount: number;
  payment_date: string;
  status: string;
}

export interface MaintenanceRequest {
  id: number;
  tenant_id: string;
  description: string;
  image_path: string | null;
  status: string;
  category: 'maintenance' | 'general_support';
  assigned_to: string | null;
  assigned_by: string | null;
  assigned_at: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string | null;
}

export interface Message {
  id: number;
  sender_id: string;
  recipient_id: string;
  maintenance_request_id?: number;
  content: string;
  message_type: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

export interface LocalService {
  id: number;
  name: string;
  description: string;
  service_type: string;
  service_link: string;
  location: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: number;
  user_id: string;
  title: string;
  content: string;
  notification_type: 'warning' | 'alert' | 'success' | 'error' | 'info';
  is_read: boolean;
  created_at: string;
}