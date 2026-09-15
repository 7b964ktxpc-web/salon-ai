export type MasterAccountStatus = 'active' | 'pending_id_link' | 'trial' | 'suspended';

export interface SalonTenant {
  id: string; // e.g. "salon-lashm-anya", "salon-aura-moscow", "salon-kate-spb"
  slug: string; // e.g. "lashm-anya", "aura", "kate"
  ownerName: string; // e.g. "Анна", "Алёна Смирнова"
  ownerPhone: string; // "+7 (913) 720-48-27"
  ownerTelegramUsername?: string; // "lashm_anya"
  ownerTelegramId?: string; // "700011122"
  isIdVerified: boolean; // whether Telegram ID has been linked by Super Admin
  status: MasterAccountStatus;
  createdAt: string;
  lastActiveAt: string;
  botUsername?: string; // e.g. "@LashmAnyaBot"
  botTokenConfigured?: boolean;
  settings: BusinessSettings;
  subscription: MasterSubscription;
  services: Service[];
  clients: Client[];
  appointments: Appointment[];
  portfolio: PortfolioItem[];
  discountCampaigns: DiscountCampaign[];
  notifications: AppNotification[];
  workingHours: WorkingHours;
  notificationSettings: NotificationSettings;
  conversations: AIConversation[];
}

export interface PlatformOwnerStats {
  totalSalons: number;
  activeMasters: number;
  pendingIdLinks: number;
  totalClientsAcrossPlatform: number;
  totalAppointmentsAcrossPlatform: number;
  mrrRub: number; // Monthly Recurring Revenue
  totalPlatformRevenue: number;
}

export interface PlatformBroadcastMessage {
  id: string;
  title: string;
  text: string;
  date: string;
  author: string;
  target: 'all_masters' | 'pro_masters' | 'trial_masters';
}

export interface PortfolioItem {
  id: string;
  title: string;
  category: 'all' | 'lashes' | 'lamination' | 'brows' | 'effects';
  categoryLabel: string;
  description: string;
  curl?: string;
  length?: string;
  volume?: string;
  duration?: string;
  serviceId?: string;
  imageUrl: string;
  tags: string[];
}

export interface Service {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number | null; // null if not set by master
  isActive: boolean;
}

export interface ClientMemoryData {
  preferred_result?: string; // e.g. "натуральный", "выразительный"
  last_service?: string; // e.g. "ламинирование", "наращивание"
  preferred_curl?: string;
  preferred_length?: string;
  allergies_or_sensitivities?: string;
  next_visit_preference?: string;
  important_notes?: string[];
  [key: string]: unknown;
}

export interface Client {
  id: string;
  telegramId: string;
  name: string;
  username?: string;
  phone?: string;
  birthday?: string; // e.g. "1998-05-15" or "05-15"
  preferredStyle?: string; // e.g. "натуральный", "выразительный", "мокрый эффект", "ламинирование"
  isRegistered?: boolean;
  birthdayDiscountCode?: string;
  firstSeenAt: string;
  lastVisitAt?: string | null;
  visitCount: number;
  preferences?: string;
  notes?: string;
  aiMemory: ClientMemoryData;
  createdAt: string;
  updatedAt: string;
}

export type AppointmentStatus = 'confirmed' | 'cancelled' | 'rescheduled' | 'completed';

export interface Appointment {
  id: string;
  clientId: string;
  serviceId: string;
  serviceName: string;
  clientName: string;
  clientPhone?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: AppointmentStatus;
  notes?: string;
  reminderSent?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkingHours {
  start: string; // "10:00"
  end: string; // "19:00"
  slotDurationMinutes: number; // 60
  workingDays: number[]; // 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun
  blockedSlots?: Record<string, string[]>; // date -> ["14:00", "15:00"]
  customOpenSlots?: Record<string, string[]>; // date -> ["20:00"]
}

export interface BusinessSettings {
  name: string; // Salon / studio name (e.g., "Lashm.anya", "Aura Lash Studio")
  masterName?: string; // Master's name (e.g., "Анна", "Екатерина")
  specialization?: string; // e.g., "Топ-лэшмейкер и ламимейкер", "Студия взгляда и бровей"
  tagline: string;
  subtitle: string;
  city: string;
  address: string;
  office: string;
  floor: string;
  rating: string;
  reviewCount: number;
  twoGisUrl: string;
  phone: string;
  telegramUsername?: string;
  telegramBotName?: string;
  logoUrl?: string;
  logoType?: 'image' | 'initials' | 'icon';
  themePreset?: 'warm_wood' | 'powder_rose' | 'dark_luxury' | 'emerald_chic' | 'cashmere';
  accentColor?: string;
  preBookingOnly: boolean;
  workingHoursDescription: string;
  reminderHoursBefore: number;
  repeatReminderDays: number;
  aiBotName?: string;
  aiGreetingMessage?: string;
  aiPersonalityTone?: 'friendly_warm' | 'luxury_concierge' | 'fast_business';
}

export type SubscriptionPlanId = 'free' | 'pro' | 'studio';

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  tagline: string;
  priceMonthly: number; // in RUB
  priceYearly: number; // in RUB (discounted)
  badge?: string;
  isPopular?: boolean;
  features: string[];
  limits: {
    maxClients: number; // e.g. 20 or Infinity
    aiBotEnabled: boolean;
    telegramPushReminders: boolean;
    promoCodesEnabled: boolean;
    customDomainAndBranding: boolean;
    multiMastersCount: number;
    analyticsLevel: 'basic' | 'pro' | 'studio';
  };
}

export interface SubscriptionInvoice {
  id: string;
  date: string;
  amount: number;
  planName: string;
  billingCycle: 'monthly' | 'yearly';
  paymentMethod: string;
  status: 'paid' | 'pending' | 'failed';
  receiptNumber: string;
}

export interface MasterSubscription {
  planId: SubscriptionPlanId;
  status: 'active' | 'trial' | 'expired';
  validUntil: string; // YYYY-MM-DD
  billingCycle: 'monthly' | 'yearly';
  autoRenew: boolean;
  paymentMethodLast4?: string;
  invoices: SubscriptionInvoice[];
}

export interface StudioPreset {
  id: string;
  name: string;
  masterName: string;
  specialization: string;
  city: string;
  address: string;
  office: string;
  floor: string;
  phone: string;
  rating: string;
  reviewCount: number;
  tagline: string;
  subtitle: string;
  logoUrl?: string;
  themePreset: 'warm_wood' | 'powder_rose' | 'dark_luxury' | 'emerald_chic' | 'cashmere';
  subscriptionPlanId: SubscriptionPlanId;
  twoGisUrl: string;
  services: Service[];
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: 'client' | 'ai' | 'master' | 'system';
  text: string;
  timestamp: string;
  quickReplies?: Array<{
    text: string;
    action: string;
    payload?: Record<string, unknown>;
  }>;
  actionRequired?: 'confirm_booking' | 'select_service' | 'select_slot' | 'handoff' | null;
  metadata?: Record<string, unknown>;
}

export interface AIConversation {
  id: string;
  clientId: string;
  telegramId: string;
  clientName: string;
  status: 'active' | 'booking_created' | 'handoff_to_master' | 'resolved';
  lastIntent?: string;
  messages: ChatMessage[];
  updatedAt: string;
}

export interface ToolActionIntent {
  intent: 
    | 'check_availability'
    | 'create_appointment'
    | 'cancel_appointment'
    | 'reschedule_appointment'
    | 'get_client_memory'
    | 'save_client_memory'
    | 'get_service'
    | 'get_business_info'
    | 'handoff_to_master'
    | 'clarify_request';
  service_id?: string;
  service_name?: string;
  date?: string;
  time?: string;
  time_from?: string;
  time_to?: string;
  appointment_id?: string;
  reason?: string;
  memory_data?: Partial<ClientMemoryData>;
  note_text?: string;
  message_to_client?: string;
}

export type NotificationType = 
  | 'appointment_reminder'
  | 'repeat_visit_reminder'
  | 'discount_offer'
  | 'booking_confirmation'
  | 'birthday_greeting'
  | 'aftercare_memo'
  | 'cancellation_notice'
  | 'master_direct_message';

export interface AppNotification {
  id: string;
  clientId: string;
  clientName: string;
  type: NotificationType;
  title: string;
  text: string;
  discountPercent?: number;
  discountCode?: string;
  appointmentId?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  status: 'sent' | 'delivered' | 'read' | 'confirmed';
  createdAt: string;
  readAt?: string;
  actionUrl?: string;
  actionLabel?: string;
}

export interface DiscountCampaign {
  id: string;
  title: string;
  description: string;
  discountPercent: number; // percentage discount (e.g. 15 for 15%)
  discountAmount?: number | null; // or fixed amount discount in RUB (e.g. 500)
  code: string;
  targetAudience: 'all' | 'repeat_needed' | 'inactive_30_days' | 'specific_client' | 'new_clients';
  targetClientId?: string;
  serviceId?: string; // specific service restriction or empty for all
  minVisitCount?: number;
  validUntil: string;
  sentCount: number;
  usedCount?: number;
  maxUses?: number; // optional limit of uses
  createdAt: string;
  isActive: boolean;
  bannerColor?: string;
}

export interface NotificationSettings {
  reminder24hEnabled: boolean;
  reminder2hEnabled: boolean;
  repeatReminderEnabled: boolean;
  repeatReminderDays: number;
  aftercareEnabled: boolean;
  reminderTemplateText: string;
  repeatTemplateText: string;
  aftercareTemplateText: string;
}
