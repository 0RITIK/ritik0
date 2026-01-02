import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Phone, MessageCircle, MapPin, Clock, Users, AlertCircle, Send } from 'lucide-react';
import { SOSButton } from '@/components/SOSButton';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/appStore';
import { 
  sendWhatsAppMessage, 
  sendSMSMessage, 
  sendTelegramMessage,
  buildEmergencyMessage,
  callEmergencyServices,
  makePhoneCall 
} from '@/utils/messaging';

export default function SOSPage() {
  const { 
    sosActive, 
    currentLocation, 
    trustedContacts, 
    sosMessage, 
    activeSOS,
    preferredMessagingApp,
  } = useAppStore();

  const primaryContact = trustedContacts.find(c => c.isPrimary);

  const sendQuickMessage = (app: 'whatsapp' | 'sms' | 'telegram') => {
    if (!primaryContact) return;
    
    const message = buildEmergencyMessage(sosMessage, currentLocation);
    const options = { phone: primaryContact.phone, message, location: currentLocation };
    
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
    }
  };

  const handleCallEmergency = () => {
    callEmergencyServices();
  };

  const handleCallPrimaryContact = () => {
    if (primaryContact) {
      makePhoneCall(primaryContact.phone);
    }
  };
  
  const locationUrl = currentLocation 
    ? `https://maps.google.com/?q=${currentLocation.lat},${currentLocation.lng}`
    : null;

  return (
    <>
      <Helmet>
        <title>SOS Emergency - SafeRoute</title>
        <meta name="description" content="Emergency SOS activation with instant alerts to trusted contacts and emergency services." />
      </Helmet>

      <div className="min-h-screen flex flex-col items-center justify-center p-6 safe-top safe-bottom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">Emergency SOS</h1>
          <p className="text-muted-foreground">
            {sosActive 
              ? 'Help is on the way. Stay calm.' 
              : 'Hold the button to activate emergency mode'}
          </p>
        </motion.div>

        <SOSButton size="large" />

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12 w-full max-w-sm space-y-4"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-caution" />
            Quick Actions
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="danger"
              size="lg"
              onClick={handleCallEmergency}
              className="flex-col h-20 gap-2"
            >
              <Phone className="w-6 h-6" />
              <span className="text-xs">Call 911</span>
            </Button>

            {primaryContact && (
              <Button
                variant="outline"
                size="lg"
                onClick={handleCallPrimaryContact}
                className="flex-col h-20 gap-2 border-primary/30"
              >
                <Users className="w-6 h-6" />
                <span className="text-xs truncate max-w-full">Call {primaryContact.name}</span>
              </Button>
            )}

            <Button
              variant="secondary"
              size="lg"
              onClick={() => sendQuickMessage('whatsapp')}
              className="flex-col h-20 gap-2 bg-green-600/20 hover:bg-green-600/30 border-green-600/30"
              disabled={!primaryContact}
            >
              <MessageCircle className="w-6 h-6 text-green-500" />
              <span className="text-xs">WhatsApp</span>
            </Button>

            <Button
              variant="secondary"
              size="lg"
              onClick={() => sendQuickMessage('sms')}
              className="flex-col h-20 gap-2"
              disabled={!primaryContact}
            >
              <Send className="w-6 h-6" />
              <span className="text-xs">Send SMS</span>
            </Button>
            
            <Button
              variant="secondary"
              size="lg"
              onClick={() => sendQuickMessage('telegram')}
              className="flex-col h-20 gap-2 bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/30 col-span-2"
              disabled={!primaryContact}
            >
              <Send className="w-6 h-6 text-blue-400" />
              <span className="text-xs">Send via Telegram</span>
            </Button>
          </div>
        </motion.div>

        {/* Current Location */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 w-full max-w-sm"
        >
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Your Location</p>
                <p className="text-xs text-muted-foreground">
                  {currentLocation 
                    ? `${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}`
                    : 'Acquiring location...'}
                </p>
              </div>
            </div>
            
            {locationUrl && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => window.open(locationUrl, '_blank')}
              >
                Open in Maps
              </Button>
            )}
          </div>
        </motion.div>

        {/* Active SOS Info */}
        {sosActive && activeSOS && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 w-full max-w-sm glass rounded-xl p-4 border border-danger/50"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 rounded-full bg-danger animate-pulse" />
              <span className="font-semibold text-danger">SOS Active</span>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Started: {new Date(activeSOS.startedAt).toLocaleTimeString()}
              </p>
              <p className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {activeSOS.contactsNotified.length} contacts notified
              </p>
            </div>
          </motion.div>
        )}

        {!primaryContact && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-sm text-muted-foreground text-center"
          >
            Add trusted contacts in your profile for quick messaging
          </motion.p>
        )}
      </div>
    </>
  );
}
