import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  Settings, 
  FileText, 
  BarChart3, 
  Wifi, 
  WifiOff, 
  Phone,
  X
} from 'lucide-react';
import { useWhatsAppService } from '@/hooks/useWhatsAppService';
import { WhatsAppSettings } from './WhatsAppSettings';
import { WhatsAppTemplates } from './WhatsAppTemplates';
import { WhatsAppLogs } from './WhatsAppLogs';
import { WhatsAppQuickSend } from './WhatsAppQuickSend';

interface WhatsAppControlPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WhatsAppControlPanel = ({ open, onOpenChange }: WhatsAppControlPanelProps) => {
  const [activeTab, setActiveTab] = useState('settings');
  const { isConnected, session } = useWhatsAppService();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-green-600" />
                <DialogTitle>WhatsApp Control Panel</DialogTitle>
              </div>
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800 border-green-200">
                    <Wifi className="h-3 w-3" />
                    Connected
                    {session?.sessionData?.phone && (
                      <span className="ml-1 text-xs">({session.sessionData.phone})</span>
                    )}
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <WifiOff className="h-3 w-3" />
                    Not Connected
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Setup
              </TabsTrigger>
              <TabsTrigger value="send" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Send
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="logs" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Logs
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto">
              <TabsContent value="settings" className="mt-0 h-full">
                <WhatsAppSettings />
              </TabsContent>

              <TabsContent value="send" className="mt-0 h-full">
                <WhatsAppQuickSend />
              </TabsContent>

              <TabsContent value="templates" className="mt-0 h-full">
                <WhatsAppTemplates />
              </TabsContent>

              <TabsContent value="logs" className="mt-0 h-full">
                <WhatsAppLogs />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};