/**
 * WhatsApp Settings Component
 * Configurable settings for broadcast behavior
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWhatsAppStore } from '@/store/whatsappStore';
import { WhatsAppSettings as SettingsType } from '@/types/whatsapp';

export const WhatsAppSettings: React.FC = () => {
  const { toast } = useToast();
  const { settings, updateSettings } = useWhatsAppStore();
  
  const [localSettings, setLocalSettings] = React.useState<SettingsType>(settings);
  
  // Update local settings when store settings change
  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);
  
  const handleSave = () => {
    updateSettings(localSettings);
    toast({
      title: '✅ Settings Saved',
      description: 'WhatsApp broadcast settings have been updated',
    });
  };
  
  const handleReset = () => {
    const defaultSettings: SettingsType = {
      defaultCountryCode: '+91',
      sendInterval: 5,
      enableJitter: true,
      retryAttempts: 2,
      retryBackoffMs: 3000
    };
    
    setLocalSettings(defaultSettings);
    updateSettings(defaultSettings);
    
    toast({
      title: '🔄 Settings Reset',
      description: 'All settings have been reset to defaults',
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          WhatsApp Broadcast Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Country Code */}
        <div className="space-y-2">
          <Label htmlFor="country-code">Default Country Code</Label>
          <Select
            value={localSettings.defaultCountryCode}
            onValueChange={(value) => setLocalSettings(prev => ({ ...prev, defaultCountryCode: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="+91">🇮🇳 India (+91)</SelectItem>
              <SelectItem value="+1">🇺🇸 United States (+1)</SelectItem>
              <SelectItem value="+44">🇬🇧 United Kingdom (+44)</SelectItem>
              <SelectItem value="+61">🇦🇺 Australia (+61)</SelectItem>
              <SelectItem value="+971">🇦🇪 UAE (+971)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Automatically added to phone numbers without country codes
          </p>
        </div>
        
        {/* Send Interval */}
        <div className="space-y-2">
          <Label htmlFor="send-interval">Send Interval (seconds)</Label>
          <Input
            id="send-interval"
            type="number"
            min="3"
            max="30"
            value={localSettings.sendInterval}
            onChange={(e) => setLocalSettings(prev => ({ 
              ...prev, 
              sendInterval: Math.max(3, Math.min(30, parseInt(e.target.value) || 5))
            }))}
          />
          <p className="text-xs text-muted-foreground">
            Delay between messages (3-30 seconds). Longer delays reduce throttling risk.
          </p>
        </div>
        
        {/* Enable Jitter */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="enable-jitter">Enable Random Jitter</Label>
            <p className="text-sm text-muted-foreground">
              Add random variation to send intervals (±30%) to appear more natural
            </p>
          </div>
          <Switch
            id="enable-jitter"
            checked={localSettings.enableJitter}
            onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, enableJitter: checked }))}
          />
        </div>
        
        {/* Retry Settings */}
        <div className="space-y-4 p-4 border rounded-lg">
          <Label className="text-sm font-medium">Retry Settings</Label>
          
          <div className="space-y-2">
            <Label htmlFor="retry-attempts">Max Retry Attempts</Label>
            <Input
              id="retry-attempts"
              type="number"
              min="0"
              max="5"
              value={localSettings.retryAttempts}
              onChange={(e) => setLocalSettings(prev => ({ 
                ...prev, 
                retryAttempts: Math.max(0, Math.min(5, parseInt(e.target.value) || 2))
              }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="retry-backoff">Retry Delay (milliseconds)</Label>
            <Input
              id="retry-backoff"
              type="number"
              min="1000"
              max="10000"
              step="500"
              value={localSettings.retryBackoffMs}
              onChange={(e) => setLocalSettings(prev => ({ 
                ...prev, 
                retryBackoffMs: Math.max(1000, Math.min(10000, parseInt(e.target.value) || 3000))
              }))}
            />
          </div>
          
          <p className="text-xs text-muted-foreground">
            Failed messages will be retried with exponential backoff
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
          
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
        </div>
        
        {/* Info Section */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="text-sm font-medium mb-2">💡 Performance Tips</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Longer intervals (7-10 seconds) reduce the risk of being flagged by WhatsApp</li>
            <li>• Jitter makes your broadcasts appear more human-like</li>
            <li>• Enable retries for unreliable network conditions</li>
            <li>• Test with small groups before broadcasting to all students</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};