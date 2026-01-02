/**
 * Messaging utilities for WhatsApp, SMS, and Telegram
 */

import type { Coordinates, TrustedContact } from '@/types';

interface MessageOptions {
  phone: string;
  message: string;
  location?: Coordinates | null;
}

/**
 * Clean phone number - remove all non-digit characters
 */
export const cleanPhoneNumber = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

/**
 * Generate Google Maps location URL
 */
export const getLocationUrl = (location: Coordinates | null): string => {
  if (!location) return '';
  return `https://maps.google.com/?q=${location.lat},${location.lng}`;
};

/**
 * Build emergency message with location
 */
export const buildEmergencyMessage = (
  baseMessage: string,
  location: Coordinates | null
): string => {
  const locationUrl = getLocationUrl(location);
  const timestamp = new Date().toLocaleTimeString();
  
  let fullMessage = baseMessage;
  fullMessage += `\n\n📍 My location: ${locationUrl || 'Location unavailable'}`;
  fullMessage += `\n⏰ Time: ${timestamp}`;
  
  return fullMessage;
};

/**
 * Open WhatsApp with pre-filled message
 * Works on both mobile (opens app) and desktop (opens web.whatsapp.com)
 */
export const sendWhatsAppMessage = ({ phone, message }: MessageOptions): void => {
  const cleanPhone = cleanPhoneNumber(phone);
  const encodedMessage = encodeURIComponent(message);
  
  // wa.me works on both mobile and desktop
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank');
};

/**
 * Open SMS app with pre-filled message
 * Uses different formats for iOS vs Android
 */
export const sendSMSMessage = ({ phone, message }: MessageOptions): void => {
  const cleanPhone = cleanPhoneNumber(phone);
  
  // Detect iOS vs Android for SMS body format
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  // iOS uses &body= while Android uses ?body=
  // But using ?body= with sms: generally works on both
  const smsUrl = isIOS
    ? `sms:${cleanPhone}&body=${encodeURIComponent(message)}`
    : `sms:${cleanPhone}?body=${encodeURIComponent(message)}`;
  
  window.location.href = smsUrl;
};

/**
 * Open Telegram with pre-filled message
 */
export const sendTelegramMessage = ({ phone, message, location }: MessageOptions): void => {
  const cleanPhone = cleanPhoneNumber(phone);
  const encodedMessage = encodeURIComponent(message);
  
  // Telegram share URL - opens in app if installed
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(getLocationUrl(location || null))}&text=${encodedMessage}`;
  window.open(telegramUrl, '_blank');
};

/**
 * Make a phone call
 */
export const makePhoneCall = (phone: string): void => {
  const cleanPhone = cleanPhoneNumber(phone);
  window.location.href = `tel:${cleanPhone}`;
};

/**
 * Call emergency services (911)
 */
export const callEmergencyServices = (): void => {
  window.location.href = 'tel:911';
};

/**
 * Send message via preferred app
 */
export const sendMessageViaApp = (
  app: 'whatsapp' | 'sms' | 'telegram',
  options: MessageOptions
): void => {
  switch (app) {
    case 'whatsapp':
      sendWhatsAppMessage(options);
      break;
    case 'sms':
      sendSMSMessage(options);
      break;
    case 'telegram':
      sendTelegramMessage(options);
      break;
    default:
      sendSMSMessage(options); // Fallback to SMS
  }
};

/**
 * Send emergency alerts to multiple contacts
 */
export const sendEmergencyAlerts = (
  contacts: TrustedContact[],
  message: string,
  location: Coordinates | null,
  preferredApp: 'whatsapp' | 'sms' | 'telegram',
  autoCall: boolean = false
): void => {
  const contactsToNotify = contacts.filter(c => c.notifyOnSOS);
  const primaryContact = contactsToNotify.find(c => c.isPrimary) || contactsToNotify[0];
  
  if (!primaryContact) {
    console.warn('No contacts to notify');
    return;
  }
  
  const fullMessage = buildEmergencyMessage(message, location);
  
  // Send message to primary contact first
  sendMessageViaApp(preferredApp, {
    phone: primaryContact.phone,
    message: fullMessage,
    location,
  });
  
  // Auto-call primary contact if enabled
  if (autoCall) {
    setTimeout(() => {
      makePhoneCall(primaryContact.phone);
    }, 800);
  }
};
