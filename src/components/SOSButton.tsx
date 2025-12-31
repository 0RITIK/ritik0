import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, X, Shield, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/appStore';
import { useAlarm } from '@/hooks/useAlarm';
import { cn } from '@/lib/utils';

interface SOSButtonProps {
  size?: 'default' | 'large';
  className?: string;
}

export function SOSButton({ size = 'default', className }: SOSButtonProps) {
  const {
    sosActive,
    triggerSOS,
    cancelSOS,
    trustedContacts,
    currentLocation,
    sosMessage,
    preferredMessagingApp,
    autoCallOnSOS,
  } = useAppStore();

  const { startAlarm, stopAlarm } = useAlarm();
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdDuration = 1500; // 1.5 seconds to activate

  // Start/stop alarm when SOS state changes
  useEffect(() => {
    if (sosActive) {
      startAlarm();
    } else {
      stopAlarm();
    }
  }, [sosActive, startAlarm, stopAlarm]);

  const sendEmergencyMessages = useCallback(() => {
    const locationUrl = currentLocation
      ? `https://maps.google.com/?q=${currentLocation.lat},${currentLocation.lng}`
      : 'Location unavailable';

    const message = encodeURIComponent(
      `${sosMessage}\n\nMy live location: ${locationUrl}\nTime: ${new Date().toLocaleTimeString()}`
    );

    // Get contacts to notify
    const contactsToNotify = trustedContacts.filter((c) => c.notifyOnSOS);
    const primaryContact = contactsToNotify.find((c) => c.isPrimary) || contactsToNotify[0];

    if (primaryContact) {
      const phone = primaryContact.phone.replace(/\D/g, '');

      if (preferredMessagingApp === 'whatsapp') {
        window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
      } else if (preferredMessagingApp === 'sms') {
        window.open(`sms:${phone}?body=${decodeURIComponent(message)}`, '_blank');
      } else if (preferredMessagingApp === 'telegram') {
        window.open(`https://t.me/share/url?url=${locationUrl}&text=${message}`, '_blank');
      }

      // Auto-call if enabled
      if (autoCallOnSOS) {
        setTimeout(() => {
          window.open(`tel:${primaryContact.phone}`, '_blank');
        }, 500);
      }
    }
  }, [currentLocation, sosMessage, trustedContacts, preferredMessagingApp, autoCallOnSOS]);

  const handleStart = useCallback(() => {
    if (sosActive) return;

    setIsHolding(true);
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / holdDuration, 1);
      setHoldProgress(progress);

      if (progress >= 1) {
        clearInterval(interval);
        triggerSOS();
        setIsHolding(false);
        setHoldProgress(0);

        // Trigger haptic feedback if available
        if ('vibrate' in navigator) {
          navigator.vibrate([200, 100, 200, 100, 200, 100, 500]);
        }

        // Send emergency messages
        sendEmergencyMessages();
      }
    }, 50);

    const handleEnd = () => {
      clearInterval(interval);
      setIsHolding(false);
      setHoldProgress(0);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchend', handleEnd);
    };

    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchend', handleEnd);
  }, [sosActive, triggerSOS, sendEmergencyMessages]);

  const handleCancel = () => {
    cancelSOS();
    if ('vibrate' in navigator) {
      navigator.vibrate(100);
    }
  };

  const buttonSize = size === 'large' ? 'sos-lg' : 'sos';

  return (
    <div className={cn('relative', className)}>
      <AnimatePresence mode="wait">
        {sosActive ? (
          <motion.div
            key="active"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            {/* Active SOS indicator */}
            <div className="relative">
              {/* Pulsing rings */}
              <motion.div
                className="absolute inset-0 rounded-full bg-danger/30"
                animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-0 rounded-full bg-danger/20"
                animate={{ scale: [1, 2.2], opacity: [0.4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
              />

              <Button
                variant="sos"
                size={buttonSize}
                onClick={handleCancel}
                className="relative z-10 animate-shake"
              >
                <Volume2 className="w-8 h-8 animate-pulse" />
              </Button>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <p className="text-danger font-bold text-lg">🚨 SOS ACTIVE 🚨</p>
              <p className="text-muted-foreground text-sm">Alarm sounding • Help requested</p>
            </motion.div>

            <div className="flex gap-3">
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  window.open('tel:911', '_blank');
                }}
              >
                <Phone className="w-4 h-4" />
                Call 911
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  const primaryContact = trustedContacts.find((c) => c.isPrimary);
                  if (primaryContact) {
                    window.open(`tel:${primaryContact.phone}`, '_blank');
                  }
                }}
                disabled={!trustedContacts.some((c) => c.isPrimary)}
              >
                <Phone className="w-4 h-4" />
                Call Contact
              </Button>
            </div>

            <Button variant="outline" size="sm" onClick={handleCancel}>
              <X className="w-4 h-4" />
              Cancel SOS
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="inactive"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative"
          >
            {/* Hold progress ring */}
            {isHolding && (
              <svg
                className="absolute inset-0 -rotate-90 pointer-events-none"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="hsl(var(--danger) / 0.3)"
                  strokeWidth="8"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="hsl(var(--danger))"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={289.03}
                  strokeDashoffset={289.03 * (1 - holdProgress)}
                />
              </svg>
            )}

            <Button
              variant="sos"
              size={buttonSize}
              onMouseDown={handleStart}
              onTouchStart={handleStart}
              className={cn('relative z-10 select-none', isHolding && 'scale-95')}
            >
              <span className="font-bold text-xl">SOS</span>
            </Button>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-muted-foreground text-xs text-center mt-3"
            >
              Hold for {holdDuration / 1000}s to activate
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
