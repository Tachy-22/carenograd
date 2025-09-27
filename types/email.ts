export enum SubscriberStatus {
  ACTIVE = 'active',
  UNSUBSCRIBED = 'unsubscribed',
  BOUNCED = 'bounced'
}

export enum SubscriberSource {
  USER_REGISTRATION = 'user_registration',
  MANUAL_ADD = 'manual_add',
  IMPORTED = 'imported'
}

export enum CampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  SENDING = 'sending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum EmailLogStatus {
  QUEUED = 'queued',
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  BOUNCED = 'bounced',
  FAILED = 'failed',
  UNSUBSCRIBED = 'unsubscribed'
}

export interface Subscriber {
  id: string;
  email: string;
  name: string;
  user_id: string | null;
  status: SubscriberStatus;
  source: SubscriberSource;
  metadata: Record<string, unknown>;
  unsubscribe_token: string | null;
  subscribed_at: string;
  unsubscribed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  template_id: string | null;
  html_content: string | null;
  text_content: string | null;
  recipient_filter: Record<string, unknown>;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  failed_count: number;
  unsubscribe_count: number;
  status: CampaignStatus;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailLog {
  id: string;
  campaign_id: string;
  subscriber_id: string;
  email: string;
  name: string;
  status: EmailLogStatus;
  gmail_message_id: string | null;
  error_message: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSubscriberDto {
  email: string;
  name: string;
  metadata?: Record<string, unknown>;
}

export interface CreateCampaignDto {
  name: string;
  subject: string;
  template_id?: string;
  html_content?: string;
  text_content?: string;
  recipient_filter?: {
    status?: SubscriberStatus[];
    source?: SubscriberSource[];
    metadata_filters?: Record<string, unknown>;
    include_users?: boolean;
    include_manual?: boolean;
  };
  scheduled_at?: string;
  template_variables?: Record<string, string>;
}

export interface SubscriberStats {
  total: number;
  active: number;
  unsubscribed: number;
  bounced: number;
  by_source: Record<SubscriberSource, number>;
}

export interface BulkImportResponse {
  imported_count: number;
  skipped_count: number;
  failed_count: number;
  errors: Array<{
    email: string;
    error: string;
  }>;
}

export interface CampaignPreview {
  subject: string;
  html_content: string;
  text_content: string;
  variables_used: string[];
}