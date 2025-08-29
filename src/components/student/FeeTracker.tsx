import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Calendar, DollarSign, Clock, CheckCircle } from 'lucide-react';

interface FeeRecord {
  id: string;
  studentId: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'pending' | 'paid' | 'overdue';
  description: string;
}

interface FeeTrackerProps {
  studentId?: string;
}

export const FeeTracker: React.FC<FeeTrackerProps> = ({ studentId }) => {
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for demonstration
    const mockFees: FeeRecord[] = [
      {
        id: '1',
        studentId: studentId || 'default',
        amount: 5000,
        dueDate: '2024-01-15',
        status: 'paid',
        paidDate: '2024-01-10',
        description: 'Tuition Fee - January'
      },
      {
        id: '2',
        studentId: studentId || 'default',
        amount: 1500,
        dueDate: '2024-02-15',
        status: 'pending',
        description: 'Library Fee - February'
      },
      {
        id: '3',
        studentId: studentId || 'default',
        amount: 3000,
        dueDate: '2024-01-01',
        status: 'overdue',
        description: 'Lab Fee - January'
      }
    ];

    setTimeout(() => {
      setFees(mockFees);
      setLoading(false);
    }, 1000);
  }, [studentId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'overdue':
        return <Calendar className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const totalPending = fees
    .filter(fee => fee.status === 'pending' || fee.status === 'overdue')
    .reduce((sum, fee) => sum + fee.amount, 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Fee Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Fee Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900">Total Fees</h3>
              <p className="text-2xl font-bold text-blue-700">
                ₹{fees.reduce((sum, fee) => sum + fee.amount, 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900">Paid</h3>
              <p className="text-2xl font-bold text-green-700">
                ₹{fees
                  .filter(fee => fee.status === 'paid')
                  .reduce((sum, fee) => sum + fee.amount, 0)
                  .toLocaleString()}
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-semibold text-red-900">Pending</h3>
              <p className="text-2xl font-bold text-red-700">
                ₹{totalPending.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {fees.map((fee) => (
              <div
                key={fee.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(fee.status)}
                  <div>
                    <h4 className="font-medium">{fee.description}</h4>
                    <p className="text-sm text-gray-600">
                      Due: {new Date(fee.dueDate).toLocaleDateString()}
                      {fee.paidDate && (
                        <span className="ml-2">
                          | Paid: {new Date(fee.paidDate).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">₹{fee.amount.toLocaleString()}</span>
                  <Badge className={getStatusColor(fee.status)}>
                    {fee.status}
                  </Badge>
                  {fee.status !== 'paid' && (
                    <Button size="sm" variant="outline">
                      Pay Now
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeeTracker;