import { db } from './db.ts';
import { ClientMemoryData, Service, Appointment } from '../src/types.ts';

export interface AvailabilityResult {
  date: string;
  available: boolean;
  slots: string[];
  message: string;
}

export const aiTools = {
  get_client(telegramId: string) {
    const client = db.getClientByTelegramId(telegramId);
    if (!client) {
      return { found: false, message: 'Клиент не найден в базе данных' };
    }
    return {
      found: true,
      client: {
        id: client.id,
        name: client.name,
        telegramId: client.telegramId,
        phone: client.phone,
        visitCount: client.visitCount,
        lastVisitAt: client.lastVisitAt,
        preferences: client.preferences,
      },
    };
  },

  get_client_memory(clientIdOrTelegramId: string) {
    let client = db.getClientById(clientIdOrTelegramId);
    if (!client) {
      client = db.getClientByTelegramId(clientIdOrTelegramId);
    }
    if (!client) {
      return { found: false, memory: null };
    }
    return {
      found: true,
      clientName: client.name,
      memory: client.aiMemory || {},
      notes: client.notes || '',
    };
  },

  get_appointment(appointmentId: string) {
    const apt = db.getAppointmentById(appointmentId);
    if (!apt) {
      return { found: false, error: 'Запись не найдена' };
    }
    return { found: true, appointment: apt };
  },

  get_services(): { services: Array<Pick<Service, 'id' | 'name' | 'description' | 'durationMinutes'> & { priceInfo: string }> } {
    const services = db.getServices().filter(s => s.isActive);
    return {
      services: services.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        durationMinutes: s.durationMinutes,
        priceInfo: s.price !== null ? `${s.price} ₽` : 'Стоимость уточняется при записи 🤍',
      })),
    };
  },

  check_availability(serviceIdOrName?: string, date?: string, timeFrom?: string, timeTo?: string): AvailabilityResult {
    // If no date provided, default to today or tomorrow
    let targetDate = date;
    if (!targetDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      targetDate = tomorrow.toISOString().split('T')[0];
    }

    const slots = db.getAvailableSlots(targetDate);
    
    // Filter by time window if specified (e.g., "вечером" -> after 17:00)
    let filteredSlots = slots;
    if (timeFrom) {
      filteredSlots = filteredSlots.filter(s => s >= timeFrom);
    }
    if (timeTo) {
      filteredSlots = filteredSlots.filter(s => s <= timeTo);
    }

    if (filteredSlots.length === 0) {
      return {
        date: targetDate,
        available: false,
        slots: [],
        message: `К сожалению, на ${targetDate} свободных окон нет 🤍 Могу проверить соседние дни?`,
      };
    }

    return {
      date: targetDate,
      available: true,
      slots: filteredSlots,
      message: `На ${targetDate} доступны следующие окна: ${filteredSlots.slice(0, 5).join(', ')}`,
    };
  },

  create_appointment(params: {
    clientId: string;
    serviceId: string;
    date: string;
    time: string;
    clientName: string;
    clientPhone?: string;
    notes?: string;
  }): { success: boolean; appointment?: Appointment; error?: string } {
    // Check availability first to avoid race conditions/double booking
    const availableSlots = db.getAvailableSlots(params.date);
    if (!availableSlots.includes(params.time)) {
      return {
        success: false,
        error: `Окно на ${params.time} (${params.date}) уже не свободно. Пожалуйста, выберите другое время 🤍`,
      };
    }

    const service = db.getServiceById(params.serviceId);
    const apt = db.createAppointment({
      ...params,
      serviceName: service?.name || 'Наращивание ресниц',
      status: 'confirmed',
    });

    return {
      success: true,
      appointment: apt,
    };
  },

  cancel_appointment(appointmentId: string, reason?: string): { success: boolean; appointment?: Appointment | null; error?: string } {
    const apt = db.updateAppointmentStatus(appointmentId, 'cancelled');
    if (!apt) {
      return { success: false, error: 'Запись не найдена' };
    }
    return { success: true, appointment: apt };
  },

  reschedule_appointment(appointmentId: string, newDate: string, newTime: string): { success: boolean; appointment?: Appointment | null; error?: string } {
    const apt = db.rescheduleAppointment(appointmentId, newDate, newTime);
    if (!apt) {
      return { success: false, error: 'Запись не найдена' };
    }
    return { success: true, appointment: apt };
  },

  save_memory(clientId: string, structuredData: Partial<ClientMemoryData>, rawNote?: string) {
    const updated = db.updateClientMemory(clientId, structuredData);
    if (rawNote) {
      db.addClientNote(clientId, rawNote);
    }
    return { success: !!updated, client: updated };
  },

  update_memory(clientId: string, partialData: Partial<ClientMemoryData>) {
    const updated = db.updateClientMemory(clientId, partialData);
    return { success: !!updated, client: updated };
  },

  get_business_info() {
    return db.businessSettings;
  },

  handoff_to_master(conversationId: string, reason: string) {
    db.updateConversationStatus(conversationId, 'handoff_to_master', 'handoff_to_master');
    return {
      success: true,
      status: 'handoff_to_master',
      message: 'Я не хочу вводить вас в заблуждение 🤍 Передам вопрос мастеру. Мастер ответит вам в ближайшее время.',
      reason,
    };
  },
};
