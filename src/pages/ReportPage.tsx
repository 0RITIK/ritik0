import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Camera, MapPin, AlertTriangle, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/stores/appStore';
import { useToast } from '@/hooks/use-toast';
import { INCIDENT_LABELS, INCIDENT_ICONS, type IncidentType } from '@/types';
import { cn } from '@/lib/utils';

const incidentTypes: IncidentType[] = ['dark_alley', 'broken_light', 'isolated_area', 'harassment', 'other'];

export default function ReportPage() {
  const [selectedType, setSelectedType] = useState<IncidentType | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const { currentLocation, addIncident, addRiskZone } = useAppStore();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!selectedType || !currentLocation) {
      toast({
        title: "Missing Information",
        description: "Please select an incident type and ensure location is enabled.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Add incident to store
    addIncident({
      id: crypto.randomUUID(),
      type: selectedType,
      location: currentLocation,
      description: description || undefined,
      reportedBy: 'current-user',
      reportedAt: new Date().toISOString(),
      verified: false,
      upvotes: 0,
    });

    // Also add as a risk zone
    addRiskZone({
      id: crypto.randomUUID(),
      center: currentLocation,
      radius: 50,
      riskLevel: selectedType === 'harassment' ? 'high' : 'medium',
      reason: description || INCIDENT_LABELS[selectedType],
      reportedAt: new Date().toISOString(),
    });

    setIsSubmitting(false);
    setSubmitted(true);

    toast({
      title: "Report Submitted",
      description: "Thank you for helping keep our community safe!",
    });

    // Reset after delay
    setTimeout(() => {
      setSubmitted(false);
      setSelectedType(null);
      setDescription('');
    }, 3000);
  };

  return (
    <>
      <Helmet>
        <title>Report Incident - SafeRoute</title>
        <meta name="description" content="Report unsafe areas, poor lighting, or incidents to help keep your community safe." />
      </Helmet>

      <div className="min-h-screen p-6 safe-top">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg mx-auto"
        >
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">Report an Issue</h1>
            <p className="text-muted-foreground">
              Help keep the community safe by reporting unsafe areas
            </p>
          </div>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 rounded-full bg-safe/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-safe" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Report Submitted!</h2>
              <p className="text-muted-foreground">
                Your report will help others stay safe
              </p>
            </motion.div>
          ) : (
            <>
              {/* Current Location */}
              <div className="glass rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Report Location</p>
                    <p className="text-xs text-muted-foreground">
                      {currentLocation 
                        ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`
                        : 'Getting your location...'}
                    </p>
                  </div>
                  {currentLocation && (
                    <div className="w-3 h-3 rounded-full bg-safe animate-pulse" />
                  )}
                </div>
              </div>

              {/* Incident Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3">
                  What's the issue?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {incidentTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all text-left tap-highlight",
                        selectedType === type
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <span className="text-2xl mb-2 block">{INCIDENT_ICONS[type]}</span>
                      <span className="text-sm font-medium">{INCIDENT_LABELS[type]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Details (optional)
                </label>
                <Textarea
                  placeholder="Describe what you observed..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[100px] bg-card"
                />
              </div>

              {/* Photo Upload (UI only) */}
              <div className="mb-8">
                <label className="block text-sm font-medium mb-2">
                  Add Photo (optional)
                </label>
                <button className="w-full h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 transition-colors">
                  <Camera className="w-8 h-8" />
                  <span className="text-sm">Tap to add photo</span>
                </button>
              </div>

              {/* Submit Button */}
              <Button
                variant="safe"
                size="lg"
                className="w-full"
                onClick={handleSubmit}
                disabled={!selectedType || !currentLocation || isSubmitting}
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-safe-foreground/30 border-t-safe-foreground rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Report
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-4">
                Reports are anonymous and help improve route safety scores
              </p>
            </>
          )}
        </motion.div>
      </div>
    </>
  );
}
