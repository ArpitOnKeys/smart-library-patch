
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FeesOverviewPanel } from './FeesOverviewPanel';
import { ExpensesPanel } from './ExpensesPanel';
import { NetIncomePanel } from './NetIncomePanel';
import { TrendingUp, Receipt, Calculator } from 'lucide-react';

export const IncomeExpensePanel = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-primary mb-2">💰 Income & Expense Management</h2>
        <p className="text-muted-foreground">Track fees, manage expenses, and monitor financial health</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Fees Overview
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Expenses
          </TabsTrigger>
          <TabsTrigger value="net-income" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Net Income
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <FeesOverviewPanel />
        </TabsContent>

        <TabsContent value="expenses">
          <ExpensesPanel />
        </TabsContent>

        <TabsContent value="net-income">
          <NetIncomePanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};
