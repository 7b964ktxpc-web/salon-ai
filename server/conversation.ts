import { db } from './db.ts';
import { yandexGpt } from './yandex-gpt.ts';
import { aiTools } from './tools.ts';
import { ChatMessage, Client } from '../src/types.ts';

export interface ChatRequestPayload {
  telegramId: string;
  name?: string;
  username?: string;
  message: string;
  actionPayload?: {
    action: string;
    serviceId?: string;
    date?: string;
    time?: string;
    appointmentId?: string;
  };
}

export class ConversationManager {
  async handleClientMessage(payload: ChatRequestPayload): Promise<{
    message: ChatMessage;
    quickReplies?: ChatMessage['quickReplies'];
    client: Client;
  }> {
    // 1. Get or create client
    const client = db.createOrGetClient({
      telegramId: payload.telegramId,
      name: payload.name || 'Гость',
      username: payload.username,
    });

    // 2. Get or create conversation
    const conversation = db.getOrCreateConversation(
      client.telegramId,
      client.name,
      client.id
    );

    // Save client's incoming message
    db.addMessage(conversation.id, {
      sender: 'client',
      text: payload.message,
    });

    // 3. Handle explicit button / inline actions first (e.g. clicking quick reply)
    if (payload.actionPayload?.action) {
      return this.handleExplicitAction(client, conversation.id, payload.actionPayload);
    }

    // 4. Check for /start or main menu commands
    if (payload.message === '/start') {
      const info = db.businessSettings;
      const responseText = `${info.name}\n\n${info.tagline || 'Взгляд без лишнего.'}\n${info.subtitle || `${info.city}, ${info.address}`}`;
      const quickReplies = [
        { text: 'Записаться', action: 'start_booking' },
        { text: 'Мои записи', action: 'my_appointments' },
        { text: 'Услуги', action: 'show_services' },
        { text: 'Задать вопрос', action: 'ask_question' },
        { text: 'О студии', action: 'about_studio' },
      ];

      const aiMsg = db.addMessage(conversation.id, {
        sender: 'ai',
        text: responseText,
        quickReplies,
      });

      return { message: aiMsg, quickReplies, client };
    }

    // 5. Gather client context
    const clientAppointments = db.getClientAppointments(client.id);
    const activeAppointment = clientAppointments.find(a => a.status === 'confirmed');
    const appointmentDetails = activeAppointment 
      ? `Ближайшая запись: ${activeAppointment.date} в ${activeAppointment.time}, услуга: ${activeAppointment.serviceName}`
      : undefined;

    // 6. Run YandexGPT / Intent Engine
    const actionIntent = await yandexGpt.processUserMessage({
      userMessage: payload.message,
      clientName: client.name,
      clientMemory: client.aiMemory,
      hasActiveAppointment: Boolean(activeAppointment),
      appointmentDetails,
      dialogHistory: conversation.messages.slice(-5).map(m => ({ sender: m.sender, text: m.text })),
    });

    // 7. Execute backend tool corresponding to the AI intent
    let responseText = actionIntent.message_to_client || 'Конечно 🤍';
    let quickReplies: ChatMessage['quickReplies'] = [];
    let actionRequired: ChatMessage['actionRequired'] = null;

    switch (actionIntent.intent) {
      case 'get_client_memory': {
        // Example: "Хочу как в прошлый раз, только чуть натуральнее"
        const memory = client.aiMemory;
        const serviceName = actionIntent.service_name || memory.last_service || 'Ламинирование ресниц';
        const targetService = db.getServices().find(s => s.name.toLowerCase() === serviceName.toLowerCase()) || db.getServices()[1];

        // Suggest dates
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];
        const slotsResult = aiTools.check_availability(targetService.id, dateStr);

        if (slotsResult.slots.length > 0) {
          quickReplies = slotsResult.slots.slice(0, 4).map(slot => ({
            text: `${slot}`,
            action: 'confirm_slot_choice',
            payload: { serviceId: targetService.id, date: dateStr, time: slot }
          }));
        }

        quickReplies.push({
          text: 'Выбрать другую дату 📅',
          action: 'pick_date',
          payload: { serviceId: targetService.id }
        });
        break;
      }

      case 'check_availability': {
        // Checking slots
        let dateToCheck = actionIntent.date;
        if (!dateToCheck) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          dateToCheck = tomorrow.toISOString().split('T')[0];
        }

        const avail = aiTools.check_availability(actionIntent.service_id, dateToCheck, actionIntent.time_from, actionIntent.time_to);
        
        if (avail.available) {
          responseText = `На ${dateToCheck} есть свободные окна 🤍 Какое время вам подходит?`;
          quickReplies = avail.slots.slice(0, 4).map(slot => ({
            text: slot,
            action: 'confirm_slot_choice',
            payload: { serviceId: actionIntent.service_id || 'srv-2', date: dateToCheck, time: slot }
          }));
        } else {
          responseText = avail.message;
          quickReplies = [
            { text: 'Выбрать другой день 📅', action: 'start_booking' },
            { text: 'Задать вопрос мастеру', action: 'ask_question' }
          ];
        }
        break;
      }

      case 'create_appointment': {
        if (actionIntent.date && actionIntent.time) {
          const creation = aiTools.create_appointment({
            clientId: client.id,
            serviceId: actionIntent.service_id || 'srv-2',
            date: actionIntent.date,
            time: actionIntent.time,
            clientName: client.name,
            clientPhone: client.phone,
          });

          if (creation.success && creation.appointment) {
            responseText = `Готово 🤍 Вы записаны на ${creation.appointment.time} (${creation.appointment.date}). Ждём вас в Lashm.anya!`;
            quickReplies = [
              { text: 'Мои записи', action: 'my_appointments' },
              { text: 'Как добраться', action: 'about_studio' }
            ];
            db.updateConversationStatus(conversation.id, 'booking_created', 'create_appointment');
          } else {
            responseText = creation.error || 'К сожалению, это время уже занято 🤍 Давайте выберем другое?';
          }
        }
        break;
      }

      case 'cancel_appointment': {
        if (activeAppointment) {
          responseText = `Отменить запись на ${activeAppointment.date} в ${activeAppointment.time} (${activeAppointment.serviceName})?`;
          quickReplies = [
            { 
              text: 'Да, отменить', 
              action: 'confirm_cancel', 
              payload: { appointmentId: activeAppointment.id } 
            },
            { 
              text: 'Оставить запись', 
              action: 'keep_appointment', 
              payload: { appointmentId: activeAppointment.id } 
            }
          ];
        } else {
          responseText = 'У вас пока нет активных записей 🤍 Хотите подобрать время?';
          quickReplies = [
            { text: 'Записаться', action: 'start_booking' }
          ];
        }
        break;
      }

      case 'reschedule_appointment': {
        if (activeAppointment) {
          responseText = `Ваша текущая запись: ${activeAppointment.date} в ${activeAppointment.time} 🤍 Давайте выберем новый день для визита:`;
          quickReplies = [
            { text: 'Выбрать новую дату 📅', action: 'reschedule_pick_date', payload: { appointmentId: activeAppointment.id } }
          ];
        } else {
          responseText = 'У вас пока нет активной записи для переноса 🤍 Можем создать новую?';
          quickReplies = [{ text: 'Записаться', action: 'start_booking' }];
        }
        break;
      }

      case 'get_service': {
        const services = db.getServices();
        quickReplies = services.map(s => ({
          text: s.name,
          action: 'select_service',
          payload: { serviceId: s.id }
        }));
        break;
      }

      case 'get_business_info': {
        quickReplies = [
          { text: 'Записаться', action: 'start_booking' },
          { text: 'Услуги', action: 'show_services' }
        ];
        break;
      }

      case 'handoff_to_master': {
        aiTools.handoff_to_master(conversation.id, actionIntent.reason || 'Запрос клиента передан мастеру');
        quickReplies = [
          { text: 'Записаться онлайн', action: 'start_booking' },
          { text: 'О студии', action: 'about_studio' }
        ];
        break;
      }

      default: {
        quickReplies = [
          { text: 'Записаться', action: 'start_booking' },
          { text: 'Мои записи', action: 'my_appointments' },
          { text: 'Услуги', action: 'show_services' }
        ];
      }
    }

    const aiMessage = db.addMessage(conversation.id, {
      sender: 'ai',
      text: responseText,
      quickReplies,
      actionRequired,
    });

    return { message: aiMessage, quickReplies, client };
  }

  /**
   * Handle interactive buttons and flow transitions
   */
  private handleExplicitAction(client: Client, conversationId: string, actionPayload: {
    action: string;
    serviceId?: string;
    date?: string;
    time?: string;
    appointmentId?: string;
  }): { message: ChatMessage; quickReplies?: ChatMessage['quickReplies']; client: Client } {
    let responseText = '';
    let quickReplies: ChatMessage['quickReplies'] = [];

    switch (actionPayload.action) {
      case 'start_booking': {
        responseText = 'Конечно 🤍 Что хотите сделать?';
        const services = db.getServices();
        quickReplies = services.map(s => ({
          text: s.name,
          action: 'select_service',
          payload: { serviceId: s.id }
        }));
        break;
      }

      case 'select_service': {
        const service = db.getServiceById(actionPayload.serviceId || 'srv-2');
        responseText = `${service?.name || 'Процедура'}\n${service?.description || ''}\n\nКогда вам удобно? 🤍`;
        
        // Show today, tomorrow, and next days
        const today = new Date();
        quickReplies = [1, 2, 3, 4].map(offset => {
          const d = new Date();
          d.setDate(today.getDate() + offset);
          const dStr = d.toISOString().split('T')[0];
          const label = d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
          return {
            text: label,
            action: 'select_date',
            payload: { serviceId: service?.id, date: dStr }
          };
        });
        break;
      }

      case 'select_date': {
        const targetDate = actionPayload.date || new Date().toISOString().split('T')[0];
        const slots = db.getAvailableSlots(targetDate);
        if (slots.length > 0) {
          responseText = `Свободные окна на ${targetDate} 🤍 Выберите время:`;
          quickReplies = slots.slice(0, 6).map(slot => ({
            text: slot,
            action: 'confirm_slot_choice',
            payload: { serviceId: actionPayload.serviceId, date: targetDate, time: slot }
          }));
        } else {
          responseText = `На эту дату свободных окон нет 🤍 Выберите другой день:`;
          const today = new Date();
          quickReplies = [2, 3, 4].map(offset => {
            const d = new Date();
            d.setDate(today.getDate() + offset);
            const dStr = d.toISOString().split('T')[0];
            return {
              text: d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric' }),
              action: 'select_date',
              payload: { serviceId: actionPayload.serviceId, date: dStr }
            };
          });
        }
        break;
      }

      case 'confirm_slot_choice': {
        const time = actionPayload.time || '14:00';
        const date = actionPayload.date || '';
        responseText = `Записать вас на ${date} в ${time}? 🤍`;
        quickReplies = [
          {
            text: 'Подтвердить',
            action: 'finalize_booking',
            payload: { serviceId: actionPayload.serviceId, date, time }
          },
          {
            text: 'Изменить время',
            action: 'select_service',
            payload: { serviceId: actionPayload.serviceId }
          }
        ];
        break;
      }

      case 'finalize_booking': {
        const date = actionPayload.date || '';
        const time = actionPayload.time || '14:00';
        const serviceId = actionPayload.serviceId || 'srv-2';

        const result = aiTools.create_appointment({
          clientId: client.id,
          serviceId,
          date,
          time,
          clientName: client.name,
          clientPhone: client.phone,
        });

        if (result.success && result.appointment) {
          const info = db.businessSettings;
          responseText = `Готово 🤍 Вы записаны на ${date} в ${time}.\n\nСтудия: ${info.name}\nАдрес: ${info.address}${info.office ? `, ${info.office}` : ''}${info.floor ? ` (${info.floor})` : ''}.\nЖдём вас!`;
          quickReplies = [
            { text: 'Мои записи', action: 'my_appointments' },
            { text: 'О студии', action: 'about_studio' }
          ];
          db.updateConversationStatus(conversationId, 'booking_created', 'create_appointment');
        } else {
          responseText = result.error || 'К сожалению, это окно только что заняли. Давайте выберем другое? 🤍';
          quickReplies = [{ text: 'Выбрать другое время', action: 'start_booking' }];
        }
        break;
      }

      case 'my_appointments': {
        const clientApts = db.getClientAppointments(client.id).filter(a => a.status === 'confirmed');
        if (clientApts.length === 0) {
          responseText = 'У вас пока нет предстоящих записей 🤍 Хотите записаться?';
          quickReplies = [{ text: 'Записаться', action: 'start_booking' }];
        } else {
          const next = clientApts[0];
          const info = db.businessSettings;
          responseText = `Предстоящая запись 🤍\n\n${next.date}\n${next.time}\n\n${next.serviceName}\n${info.name} (${info.address})`;
          quickReplies = [
            { text: 'Перенести', action: 'reschedule_pick_date', payload: { appointmentId: next.id } },
            { text: 'Отменить', action: 'confirm_cancel', payload: { appointmentId: next.id } }
          ];
        }
        break;
      }

      case 'confirm_cancel': {
        const aptId = actionPayload.appointmentId;
        if (aptId) {
          const apt = db.getAppointmentById(aptId);
          if (apt) {
            responseText = `Отменить запись на ${apt.date} в ${apt.time}?`;
            quickReplies = [
              { text: 'Отменить запись', action: 'do_cancel', payload: { appointmentId: aptId } },
              { text: 'Оставить запись', action: 'keep_appointment', payload: { appointmentId: aptId } }
            ];
          }
        }
        break;
      }

      case 'do_cancel': {
        const aptId = actionPayload.appointmentId;
        if (aptId) {
          aiTools.cancel_appointment(aptId, 'Отменено клиентом через Telegram');
          responseText = 'Запись отменена 🤍 Если захотите подобрать другое время — просто напишите мне.';
          quickReplies = [{ text: 'Записаться', action: 'start_booking' }];
        }
        break;
      }

      case 'keep_appointment': {
        responseText = 'Договорились, запись остаётся в силе 🤍 Будем рады встрече!';
        quickReplies = [{ text: 'Мои записи', action: 'my_appointments' }];
        break;
      }

      case 'show_services': {
        const services = db.getServices();
        const info = db.businessSettings;
        responseText = `Услуги студии ${info.name}:\n\n` + services.map(s => {
          const priceStr = s.price !== null ? `${s.price} ₽` : 'Стоимость уточняется при записи 🤍';
          return `• ${s.name}\n${s.description}\n${priceStr}`;
        }).join('\n\n');
        quickReplies = [
          { text: 'Записаться', action: 'start_booking' },
          { text: 'Задать вопрос', action: 'ask_question' }
        ];
        break;
      }

      case 'about_studio': {
        const info = db.businessSettings;
        const ratingStr = info.rating ? `Рейтинг: ${info.rating} ★ (${info.reviewCount || 10} отзывов)` : '';
        responseText = `${info.name}\n${info.tagline || ''}\n\n${info.subtitle || ''}\n\nГород: ${info.city}\nАдрес: ${info.address}${info.office ? `, ${info.office}` : ''}\nТелефон: ${info.phone}\n${ratingStr}\n${info.workingHoursDescription || 'Работа по предварительной записи 🤍'}`;
        quickReplies = [
          { text: 'Записаться', action: 'start_booking' },
          { text: 'Услуги', action: 'show_services' }
        ];
        break;
      }

      case 'ask_question': {
        responseText = 'Напишите любой вопрос, и я помогу 🤍 А если потребуется детальная консультация — я позову мастера.';
        break;
      }

      default: {
        responseText = 'Чем я могу помочь вам? 🤍';
        quickReplies = [
          { text: 'Записаться', action: 'start_booking' },
          { text: 'Мои записи', action: 'my_appointments' }
        ];
      }
    }

    const aiMsg = db.addMessage(conversationId, {
      sender: 'ai',
      text: responseText,
      quickReplies,
    });

    return { message: aiMsg, quickReplies, client };
  }
}

export const conversationManager = new ConversationManager();
