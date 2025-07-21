import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  DollarSign, 
  AlertCircle, 
  BookOpen, 
  TrendingUp, 
  Calendar,
  Clock,
  Target,
  Activity
} from 'lucide-react';
import { studentDb, feePaymentDb } from '@/lib/database';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

interface DashboardStats {
  totalStudents: number;
  todaysIncome: number;
  overdueFees: number;
  totalBooks: number;
  monthlyGrowth: number;
  attendanceRate: number;
  activeIssues: number;
}

interface RecentActivity {
  id: string;
  type: 'admission' | 'payment' | 'book_issue' | 'book_return';
  description: string;
  timestamp: string;
  amount?: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export const DashboardPanel = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    todaysIncome: 0,
    overdueFees: 0,
    totalBooks: 0,
    monthlyGrowth: 0,
    attendanceRate: 0,
    activeIssues: 0
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [feeDistribution, setFeeDistribution] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const students = studentDb.getAll();
      const payments = feePaymentDb.getAll();
      const today = new Date().toISOString().split('T')[0];
      
      // Calculate stats
      const todaysPayments = payments.filter(p => p.paymentDate.startsWith(today));
      const todaysIncome = todaysPayments.reduce((sum, p) => sum + p.amount, 0);
      
      // Mock data for demo - in real app, this would come from actual database
      const mockStats: DashboardStats = {
        totalStudents: students.length,
        todaysIncome,
        overdueFees: 5,
        totalBooks: 150,
        monthlyGrowth: 12.5,
        attendanceRate: 87.3,
        activeIssues: 23
      };

      setStats(mockStats);

      // Generate mock monthly data
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const mockMonthlyData = months.map(month => ({
        month,
        income: Math.floor(Math.random() * 10000) + 5000,
        students: Math.floor(Math.random() * 20) + 10,
        books: Math.floor(Math.random() * 30) + 15
      }));
      setMonthlyData(mockMonthlyData);

      // Fee distribution data
      const feeData = [
        { name: 'Paid', value: students.length - 5, color: COLORS[0] },
        { name: 'Overdue', value: 5, color: COLORS[1] },
        { name: 'Partial', value: 2, color: COLORS[2] }
      ];
      setFeeDistribution(feeData);

      // Recent activity (mock data)
      const activities: RecentActivity[] = [
        {
          id: '1',
          type: 'admission',
          description: 'New student admission: John Doe',
          timestamp: '2 hours ago'
        },
        {
          id: '2',
          type: 'payment',
          description: 'Fee payment received from Sarah Wilson',
          timestamp: '4 hours ago',
          amount: 2500
        },
        {
          id: '3',
          type: 'book_issue',
          description: 'Book issued: "Physics Fundamentals" to Mike Johnson',
          timestamp: '6 hours ago'
        },
        {
          id: '4',
          type: 'book_return',
          description: 'Book returned: "Chemistry Basics" by Lisa Anderson',
          timestamp: '1 day ago'
        }
      ];
      setRecentActivity(activities);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'admission': return <Users className="h-4 w-4" />;
      case 'payment': return <DollarSign className="h-4 w-4" />;
      case 'book_issue': return <BookOpen className="h-4 w-4" />;
      case 'book_return': return <BookOpen className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'admission': return 'bg-blue-500';
      case 'payment': return 'bg-green-500';
      case 'book_issue': return 'bg-purple-500';
      case 'book_return': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            📊 Dashboard Analytics
          </h2>
          <p className="text-muted-foreground">
            Real-time insights and performance metrics for your library
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <Card className="glass-card hover-scale">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Students
                </CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground mt-1">
                +{Math.floor(stats.monthlyGrowth)}% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card hover-scale">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Today's Income
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">₹{stats.todaysIncome}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Daily revenue tracking
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card hover-scale">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Overdue Fees
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-red-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.overdueFees}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Requires attention
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card hover-scale">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Books
                </CardTitle>
                <BookOpen className="h-4 w-4 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalBooks}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.activeIssues} currently issued
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Charts and Analytics */}
        <motion.div variants={itemVariants}>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid grid-cols-3 w-fit">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Monthly Income Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="month" 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="income" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--primary))' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Fee Collection Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={feeDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {feeDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-4 mt-4">
                      {feeDistribution.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-sm text-muted-foreground">{entry.name}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-lg">Monthly Growth</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-3xl font-bold text-green-500">
                      +{stats.monthlyGrowth}%
                    </div>
                    <Progress value={stats.monthlyGrowth * 2} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      Student enrollment growth this month
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-lg">Attendance Rate</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-3xl font-bold text-blue-500">
                      {stats.attendanceRate}%
                    </div>
                    <Progress value={stats.attendanceRate} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      Average student attendance
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-lg">Active Issues</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-3xl font-bold text-purple-500">
                      {stats.activeIssues}
                    </div>
                    <Progress value={(stats.activeIssues / stats.totalBooks) * 100} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      Books currently issued to students
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Student vs Book Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="month" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px'
                        }}
                      />
                      <Bar 
                        dataKey="students" 
                        fill="hsl(var(--primary))" 
                        name="New Students"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        dataKey="books" 
                        fill="hsl(var(--secondary))" 
                        name="Books Issued"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={itemVariants}>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest actions and updates in your library system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className={`p-2 rounded-full ${getActivityColor(activity.type)} text-white`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground">
                          {activity.timestamp}
                        </p>
                        {activity.amount && (
                          <Badge variant="secondary" className="text-xs">
                            ₹{activity.amount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};