
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdmissionForm } from './AdmissionForm';
import { StudentTable } from './StudentTable';
import { FeeTracker } from './FeeTracker';

export const StudentPanel = () => {
  const [activeTab, setActiveTab] = useState('admission');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleStudentAdded = () => {
    setRefreshTrigger(prev => prev + 1);
    setActiveTab('data'); // Switch to data panel after adding student
  };

  const handleStudentUpdated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">🧑‍🎓 Student Panel</CardTitle>
          <CardDescription>
            Manage student admissions, data, and fee tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="admission">Admission Form</TabsTrigger>
              <TabsTrigger value="data">Student Data</TabsTrigger>
              <TabsTrigger value="fees">Fee Tracker</TabsTrigger>
            </TabsList>
            
            <TabsContent value="admission" className="mt-6">
              <AdmissionForm onStudentAdded={handleStudentAdded} />
            </TabsContent>
            
            <TabsContent value="data" className="mt-6">
              <StudentTable 
                refreshTrigger={refreshTrigger} 
                onStudentUpdated={handleStudentUpdated}
              />
            </TabsContent>
            
            <TabsContent value="fees" className="mt-6">
              <FeeTracker refreshTrigger={refreshTrigger} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
