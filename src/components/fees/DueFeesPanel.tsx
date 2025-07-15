
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DueFeeSlipPanel } from './DueFeeSlipPanel';
import { HistoryPanel } from './HistoryPanel';

export const DueFeesPanel = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleReminderSent = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">⏳ Due Fees Panel</CardTitle>
          <CardDescription>
            Track pending fees and send WhatsApp reminders to students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="due-slips" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="due-slips">Due Fee Slip Panel</TabsTrigger>
              <TabsTrigger value="history">History Panel</TabsTrigger>
            </TabsList>
            
            <TabsContent value="due-slips" className="mt-6">
              <DueFeeSlipPanel onReminderSent={handleReminderSent} />
            </TabsContent>
            
            <TabsContent value="history" className="mt-6">
              <HistoryPanel refreshTrigger={refreshTrigger} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
