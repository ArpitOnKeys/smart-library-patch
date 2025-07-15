
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { feePaymentDb, studentDb } from '@/lib/database';
import { Calendar, Users, DollarSign, TrendingUp } from 'lucide-react';

export const FeesOverviewPanel = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedShift, setSelectedShift] = useState<'all' | 'Morning' | 'Evening'>('all');

  const payments = feePaymentDb.getAll();
  const students = studentDb.getAll();

  // Calculate monthly data for chart
  const monthlyData = useMemo(() => {
    const data: { [key: string]: number } = {};
    
    payments.forEach(payment => {
      const date = new Date(payment.paymentDate);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      data[monthKey] = (data[monthKey] || 0) + payment.amount;
    });

    return Object.entries(data)
      .map(([month, amount]) => ({
        month: month.split('-')[1] + '/' + month.split('-')[0].slice(2),
        amount
      }))
      .slice(-6); // Last 6 months
  }, [payments]);

  // Filter payments based on selected criteria
  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const paymentDate = new Date(payment.paymentDate);
      const matchesMonth = paymentDate.getMonth() + 1 === selectedMonth;
      const matchesYear = paymentDate.getFullYear() === selectedYear;
      
      if (!matchesMonth || !matchesYear) return false;
      
      if (selectedShift === 'all') return true;
      
      const student = students.find(s => s.id === payment.studentId);
      return student?.shift === selectedShift;
    });
  }, [payments, selectedMonth, selectedYear, selectedShift, students]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalCollected = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const uniqueStudents = new Set(filteredPayments.map(p => p.studentId)).size;
    const averagePayment = uniqueStudents > 0 ? totalCollected / uniqueStudents : 0;
    
    // Current month total
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const currentMonthTotal = payments
      .filter(p => {
        const date = new Date(p.paymentDate);
        return date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + p.amount, 0);

    // Previous month total
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const prevMonthTotal = payments
      .filter(p => {
        const date = new Date(p.paymentDate);
        return date.getMonth() + 1 === prevMonth && date.getFullYear() === prevYear;
      })
      .reduce((sum, p) => sum + p.amount, 0);

    // All-time total
    const allTimeTotal = payments.reduce((sum, p) => sum + p.amount, 0);

    return {
      totalCollected,
      uniqueStudents,
      averagePayment,
      currentMonthTotal,
      prevMonthTotal,
      allTimeTotal
    };
  }, [filteredPayments, payments]);

  const chartConfig = {
    amount: {
      label: "Amount",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.currentMonthTotal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.currentMonthTotal >= stats.prevMonthTotal ? '+' : ''}
              {((stats.currentMonthTotal - stats.prevMonthTotal) / Math.max(stats.prevMonthTotal, 1) * 100).toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Previous Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.prevMonthTotal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Last month collection</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">All-Time Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.allTimeTotal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total fees collected</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Fee Collection Trend</CardTitle>
          <CardDescription>Last 6 months fee collection overview</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="month" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="amount" fill="var(--color-amount)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Fee Payments</CardTitle>
          <div className="flex gap-4">
            <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => (
                  <SelectItem key={2020 + i} value={(2020 + i).toString()}>
                    {2020 + i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedShift} onValueChange={(value: any) => setSelectedShift(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Shifts</SelectItem>
                <SelectItem value="Morning">Morning</SelectItem>
                <SelectItem value="Evening">Evening</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {/* Statistics for filtered period */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Students Paid</p>
                <p className="text-xl font-semibold">{stats.uniqueStudents}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Collected</p>
                <p className="text-xl font-semibold">₹{stats.totalCollected.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Average Payment</p>
                <p className="text-xl font-semibold">₹{Math.round(stats.averagePayment).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Payments Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Month/Year</TableHead>
                <TableHead>Shift</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No payments found for selected criteria
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((payment) => {
                  const student = students.find(s => s.id === payment.studentId);
                  return (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{student?.name || 'Unknown'}</TableCell>
                      <TableCell>₹{payment.amount.toLocaleString()}</TableCell>
                      <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {payment.month} {payment.year}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={student?.shift === 'Morning' ? 'default' : 'secondary'}>
                          {student?.shift || 'Unknown'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
