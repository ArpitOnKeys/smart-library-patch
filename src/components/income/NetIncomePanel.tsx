
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { feePaymentDb, expenseDb } from '@/lib/database';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';

export const NetIncomePanel = () => {
  const [viewType, setViewType] = useState<'monthly' | 'cumulative'>('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const payments = feePaymentDb.getAll();
  const expenses = expenseDb.getAll();

  // Calculate monthly net income data
  const monthlyNetData = useMemo(() => {
    const monthlyData: { [key: string]: { income: number; expense: number; net: number } } = {};
    
    // Initialize all months for selected year
    for (let month = 1; month <= 12; month++) {
      const key = `${selectedYear}-${month.toString().padStart(2, '0')}`;
      monthlyData[key] = { income: 0, expense: 0, net: 0 };
    }

    // Add income data
    payments.forEach(payment => {
      const date = new Date(payment.paymentDate);
      if (date.getFullYear() === selectedYear) {
        const key = `${selectedYear}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        monthlyData[key].income += payment.amount;
      }
    });

    // Add expense data
    expenses.forEach(expense => {
      const date = new Date(expense.date);
      if (date.getFullYear() === selectedYear) {
        const key = `${selectedYear}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        monthlyData[key].expense += expense.amount;
      }
    });

    // Calculate net income
    Object.keys(monthlyData).forEach(key => {
      monthlyData[key].net = monthlyData[key].income - monthlyData[key].expense;
    });

    return Object.entries(monthlyData).map(([key, data]) => ({
      month: new Date(parseInt(key.split('-')[0]), parseInt(key.split('-')[1]) - 1).toLocaleString('default', { month: 'short' }),
      monthKey: key,
      ...data
    }));
  }, [payments, expenses, selectedYear]);

  // Calculate cumulative data
  const cumulativeNetData = useMemo(() => {
    let cumulativeIncome = 0;
    let cumulativeExpense = 0;
    
    return monthlyNetData.map(monthData => {
      cumulativeIncome += monthData.income;
      cumulativeExpense += monthData.expense;
      return {
        ...monthData,
        cumulativeIncome,
        cumulativeExpense,
        cumulativeNet: cumulativeIncome - cumulativeExpense
      };
    });
  }, [monthlyNetData]);

  // Current month statistics
  const currentMonthStats = useMemo(() => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const currentIncome = payments
      .filter(p => {
        const date = new Date(p.paymentDate);
        return date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + p.amount, 0);

    const currentExpense = expenses
      .filter(e => {
        const date = new Date(e.date);
        return date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    const currentNet = currentIncome - currentExpense;

    return { currentIncome, currentExpense, currentNet };
  }, [payments, expenses]);

  // Calculate financial health score (0-100)
  const healthScore = useMemo(() => {
    const lastThreeMonths = monthlyNetData.slice(-3);
    const positiveMonths = lastThreeMonths.filter(m => m.net > 0).length;
    const averageNet = lastThreeMonths.reduce((sum, m) => sum + m.net, 0) / 3;
    
    // Base score on positive months and average net income
    let score = (positiveMonths / 3) * 60; // 60% for having positive months
    
    // Add bonus for higher average net income
    if (averageNet > 10000) score += 40;
    else if (averageNet > 5000) score += 30;
    else if (averageNet > 0) score += 20;
    else if (averageNet > -5000) score += 10;
    
    return Math.min(100, Math.max(0, score));
  }, [monthlyNetData]);

  const getHealthStatus = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-green-600', icon: CheckCircle };
    if (score >= 60) return { label: 'Good', color: 'text-blue-600', icon: CheckCircle };
    if (score >= 40) return { label: 'Fair', color: 'text-yellow-600', icon: AlertCircle };
    return { label: 'Poor', color: 'text-red-600', icon: AlertCircle };
  };

  const healthStatus = getHealthStatus(healthScore);
  const HealthIcon = healthStatus.icon;

  const chartConfig = {
    income: {
      label: "Income",
      color: "hsl(var(--primary))",
    },
    expense: {
      label: "Expense", 
      color: "hsl(var(--destructive))",
    },
    net: {
      label: "Net Income",
      color: "hsl(142, 76%, 36%)",
    },
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fees Collected</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{currentMonthStats.currentIncome.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Current month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expenses Incurred</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₹{currentMonthStats.currentExpense.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Current month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${currentMonthStats.currentNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{currentMonthStats.currentNet.toLocaleString()}
            </div>
            <div className="flex items-center mt-1">
              <Badge variant={currentMonthStats.currentNet >= 0 ? 'default' : 'destructive'}>
                {currentMonthStats.currentNet >= 0 ? 'Profit' : 'Loss'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Health Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HealthIcon className={`h-5 w-5 ${healthStatus.color}`} />
            Financial Health Score
          </CardTitle>
          <CardDescription>Based on last 3 months performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Health Score</span>
              <span className={`text-lg font-bold ${healthStatus.color}`}>
                {Math.round(healthScore)}/100 - {healthStatus.label}
              </span>
            </div>
            <Progress value={healthScore} className="h-3" />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Positive Months (Last 3): </span>
                <span className="font-medium">
                  {monthlyNetData.slice(-3).filter(m => m.net > 0).length}/3
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Avg Monthly Net: </span>
                <span className="font-medium">
                  ₹{Math.round(monthlyNetData.slice(-3).reduce((sum, m) => sum + m.net, 0) / 3).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Net Income Analysis</CardTitle>
              <CardDescription>Income vs Expenses over time</CardDescription>
            </div>
            <div className="flex gap-4">
              <Select value={viewType} onValueChange={(value: any) => setViewType(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="cumulative">Cumulative</SelectItem>
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            {viewType === 'monthly' ? (
              <BarChart data={monthlyNetData}>
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="income" fill="var(--color-income)" name="Income" />
                <Bar dataKey="expense" fill="var(--color-expense)" name="Expense" />
              </BarChart>
            ) : (
              <LineChart data={cumulativeNetData}>
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  dataKey="cumulativeNet" 
                  stroke="var(--color-net)" 
                  strokeWidth={3}
                  name="Cumulative Net"
                />
              </LineChart>
            )}
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Monthly Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Breakdown - {selectedYear}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyNetData.map((monthData, index) => (
              <div key={monthData.monthKey} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="text-sm font-medium w-12">{monthData.month}</div>
                  <div className="flex gap-6">
                    <div>
                      <span className="text-xs text-muted-foreground">Income: </span>
                      <span className="text-sm font-medium text-green-600">₹{monthData.income.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Expense: </span>
                      <span className="text-sm font-medium text-red-600">₹{monthData.expense.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={monthData.net >= 0 ? 'default' : 'destructive'}>
                    {monthData.net >= 0 ? '+' : ''}₹{monthData.net.toLocaleString()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
