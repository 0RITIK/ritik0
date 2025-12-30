import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { 
  User, Phone, MessageCircle, Shield, Bell, 
  ChevronRight, Plus, Trash2, Star, Settings,
  Edit2, Check, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useAppStore } from '@/stores/appStore';
import { useToast } from '@/hooks/use-toast';
import type { TrustedContact } from '@/types';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const { toast } = useToast();
  const {
    userName,
    userPhone,
    trustedContacts,
    sosMessage,
    preferredMessagingApp,
    autoCallOnSOS,
    setUserName,
    setUserPhone,
    addTrustedContact,
    removeTrustedContact,
    updateTrustedContact,
    setSosMessage,
    setPreferredMessagingApp,
    setAutoCallOnSOS,
  } = useAppStore();

  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '', relationship: '' });

  const handleSaveName = () => {
    setUserName(tempName);
    setEditingName(false);
    toast({ title: "Name updated" });
  };

  const handleAddContact = () => {
    if (!newContact.name || !newContact.phone) {
      toast({ title: "Please fill in name and phone", variant: "destructive" });
      return;
    }

    const contact: TrustedContact = {
      id: crypto.randomUUID(),
      name: newContact.name,
      phone: newContact.phone,
      relationship: newContact.relationship || 'Other',
      notifyOnSOS: true,
      isPrimary: trustedContacts.length === 0,
    };

    addTrustedContact(contact);
    setNewContact({ name: '', phone: '', relationship: '' });
    setShowAddContact(false);
    toast({ title: "Contact added" });
  };

  const handleSetPrimary = (id: string) => {
    trustedContacts.forEach(c => {
      updateTrustedContact(c.id, { isPrimary: c.id === id });
    });
    toast({ title: "Primary contact updated" });
  };

  return (
    <>
      <Helmet>
        <title>Profile - SafeRoute</title>
        <meta name="description" content="Manage your SafeRoute profile, trusted contacts, and emergency settings." />
      </Helmet>

      <div className="min-h-screen p-6 safe-top">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg mx-auto"
        >
          <h1 className="text-2xl font-bold mb-6">Profile</h1>

          {/* User Info */}
          <section className="glass rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center">
                <User className="w-8 h-8 text-primary-foreground" />
              </div>
              <div className="flex-1">
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      placeholder="Your name"
                      className="h-9"
                    />
                    <Button size="icon-sm" variant="ghost" onClick={handleSaveName}>
                      <Check className="w-4 h-4 text-safe" />
                    </Button>
                    <Button size="icon-sm" variant="ghost" onClick={() => setEditingName(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">{userName || 'Add your name'}</h2>
                    <Button size="icon-sm" variant="ghost" onClick={() => {
                      setTempName(userName);
                      setEditingName(true);
                    }}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">{userPhone || 'Add phone number'}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <label className="text-sm text-muted-foreground">Phone Number</label>
              <Input
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="mt-1"
              />
            </div>
          </section>

          {/* Trusted Contacts */}
          <section className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Trusted Contacts</h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowAddContact(!showAddContact)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>

            {showAddContact && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="glass rounded-xl p-4 mb-4"
              >
                <Input
                  placeholder="Contact name"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className="mb-3"
                />
                <Input
                  placeholder="Phone number"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  className="mb-3"
                />
                <Input
                  placeholder="Relationship (e.g., Mom, Friend)"
                  value={newContact.relationship}
                  onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                  className="mb-4"
                />
                <div className="flex gap-2">
                  <Button variant="safe" size="sm" onClick={handleAddContact}>
                    Add Contact
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowAddContact(false)}>
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}

            <div className="space-y-3">
              {trustedContacts.length === 0 ? (
                <div className="glass rounded-xl p-6 text-center">
                  <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No trusted contacts yet</p>
                  <p className="text-sm text-muted-foreground">Add contacts who will be notified in emergencies</p>
                </div>
              ) : (
                trustedContacts.map((contact) => (
                  <motion.div
                    key={contact.id}
                    layout
                    className="glass rounded-xl p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        contact.isPrimary ? "bg-primary" : "bg-secondary"
                      )}>
                        <User className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{contact.name}</span>
                          {contact.isPrimary && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                              Primary
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{contact.phone}</p>
                        <p className="text-xs text-muted-foreground">{contact.relationship}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!contact.isPrimary && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleSetPrimary(contact.id)}
                          >
                            <Star className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            removeTrustedContact(contact.id);
                            toast({ title: "Contact removed" });
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-danger" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                      <span className="text-sm text-muted-foreground">Notify on SOS</span>
                      <Switch
                        checked={contact.notifyOnSOS}
                        onCheckedChange={(checked) => 
                          updateTrustedContact(contact.id, { notifyOnSOS: checked })
                        }
                      />
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </section>

          {/* SOS Settings */}
          <section className="mb-6">
            <h2 className="text-lg font-semibold mb-4">SOS Settings</h2>
            
            <div className="glass rounded-xl divide-y divide-border">
              <div className="p-4">
                <label className="text-sm font-medium block mb-2">Emergency Message</label>
                <Textarea
                  value={sosMessage}
                  onChange={(e) => setSosMessage(e.target.value)}
                  placeholder="Your emergency message..."
                  className="min-h-[80px] bg-secondary"
                />
              </div>

              <div className="p-4">
                <label className="text-sm font-medium block mb-3">Preferred Messaging App</label>
                <div className="flex gap-2">
                  {(['whatsapp', 'sms', 'telegram'] as const).map((app) => (
                    <Button
                      key={app}
                      variant={preferredMessagingApp === app ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPreferredMessagingApp(app)}
                      className="capitalize"
                    >
                      {app}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-call on SOS</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically call primary contact
                  </p>
                </div>
                <Switch
                  checked={autoCallOnSOS}
                  onCheckedChange={setAutoCallOnSOS}
                />
              </div>
            </div>
          </section>

          {/* App Info */}
          <section className="text-center py-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-3">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
            <h3 className="font-semibold">SafeRoute</h3>
            <p className="text-sm text-muted-foreground">Version 1.0.0</p>
            <p className="text-xs text-muted-foreground mt-2">
              Your safety is our priority
            </p>
          </section>
        </motion.div>
      </div>
    </>
  );
}
