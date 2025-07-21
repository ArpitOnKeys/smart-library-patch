import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  X, 
  Settings,
  Calendar,
  DollarSign,
  BookOpen,
  Users,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { studentDb, feePaymentDb } from '@/lib/database';

interface Notification {
  id: string;
  type: 'due_fee' | 'overdue_book' | 'low_stock' | 'system' | 'reminder';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  data?: any;
}

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');

  const { toast } = useToast();

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(generateAutoNotifications, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = () => {
    // Load existing notifications from localStorage
    const stored = localStorage.getItem('patch_notifications');
    let existing: Notification[] = stored ? JSON.parse(stored) : [];

    // Generate system notifications
    const generated = generateNotifications();
    const combined = [...existing, ...generated];

    // Remove duplicates and sort by timestamp
    const unique = combined.filter((notification, index, self) => 
      index === self.findIndex(n => n.id === notification.id)
    );

    const sorted = unique.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    setNotifications(sorted);
    setUnreadCount(sorted.filter(n => !n.isRead).length);
    
    // Save back to localStorage
    localStorage.setItem('patch_notifications', JSON.stringify(sorted));
  };

  const generateNotifications = (): Notification[] => {
    const notifications: Notification[] = [];
    const students = studentDb.getAll();
    const payments = feePaymentDb.getAll();
    const now = new Date();

    // Check for overdue fees
    students.forEach(student => {
      const studentPayments = payments.filter(p => p.studentId === student.id);
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      
      const currentMonthPayment = studentPayments.find(p => 
        p.month === currentMonth.toString().padStart(2, '0') && 
        p.year === currentYear
      );

      if (!currentMonthPayment) {
        notifications.push({
          id: `due_fee_${student.id}_${currentMonth}_${currentYear}`,
          type: 'due_fee',
          title: 'Fee Overdue',
          message: `${student.name} has not paid fees for ${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
          timestamp: new Date().toISOString(),
          isRead: false,
          priority: 'high',
          data: { studentId: student.id, amount: student.monthlyFees }
        });
      }
    });

    // System notifications
    if (students.length > 0) {
      notifications.push({
        id: `system_${Date.now()}`,
        type: 'system',
        title: 'System Status',
        message: `Library is running smoothly with ${students.length} active students`,
        timestamp: new Date().toISOString(),
        isRead: false,
        priority: 'low'
      });
    }

    return notifications;
  };

  const generateAutoNotifications = () => {
    const newNotifications = generateNotifications();
    const existing = JSON.parse(localStorage.getItem('patch_notifications') || '[]');
    
    const filtered = newNotifications.filter(newNotif => 
      !existing.some((existingNotif: Notification) => existingNotif.id === newNotif.id)
    );

    if (filtered.length > 0) {
      const updated = [...existing, ...filtered];
      localStorage.setItem('patch_notifications', JSON.stringify(updated));
      setNotifications(updated);
      setUnreadCount(updated.filter(n => !n.isRead).length);

      // Show toast for high priority notifications
      filtered.forEach(notification => {
        if (notification.priority === 'high') {
          toast({
            title: notification.title,
            description: notification.message,
            variant: notification.type === 'due_fee' ? 'destructive' : 'default'
          });
        }
      });
    }
  };

  const markAsRead = (id: string) => {
    const updated = notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    );
    setNotifications(updated);
    setUnreadCount(updated.filter(n => !n.isRead).length);
    localStorage.setItem('patch_notifications', JSON.stringify(updated));
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    setNotifications(updated);
    setUnreadCount(0);
    localStorage.setItem('patch_notifications', JSON.stringify(updated));
    
    toast({
      title: "All notifications marked as read",
      description: "Your notification center has been cleared"
    });
  };

  const deleteNotification = (id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    setUnreadCount(updated.filter(n => !n.isRead).length);
    localStorage.setItem('patch_notifications', JSON.stringify(updated));
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem('patch_notifications');
    
    toast({
      title: "All notifications cleared",
      description: "Your notification center is now empty"
    });
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'due_fee': return <DollarSign className="h-4 w-4" />;
      case 'overdue_book': return <BookOpen className="h-4 w-4" />;
      case 'low_stock': return <AlertTriangle className="h-4 w-4" />;
      case 'system': return <Settings className="h-4 w-4" />;
      case 'reminder': return <Clock className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: Notification['type'], priority: Notification['priority']) => {
    if (priority === 'high') return 'bg-red-500';
    switch (type) {
      case 'due_fee': return 'bg-orange-500';
      case 'overdue_book': return 'bg-red-500';
      case 'low_stock': return 'bg-yellow-500';
      case 'system': return 'bg-blue-500';
      case 'reminder': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityBadge = (priority: Notification['priority']) => {
    const variants = {
      low: 'secondary',
      medium: 'default',
      high: 'destructive'
    } as const;

    return <Badge variant={variants[priority]} className="text-xs">{priority.toUpperCase()}</Badge>;
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread': return !notification.isRead;
      case 'high': return notification.priority === 'high';
      default: return true;
    }
  });

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="h-8 w-8 text-primary" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                🔔 Notification Center
              </h2>
              <p className="text-muted-foreground">
                Stay updated with important alerts and reminders
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={unreadCount === 0}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
            <Button variant="destructive" size="sm" onClick={clearAll} disabled={notifications.length === 0}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>
      </motion.div>

      <Card className="glass-card">
        <CardContent className="p-0">
          <Tabs value={filter} onValueChange={(value) => setFilter(value as any)} className="w-full">
            <div className="border-b">
              <TabsList className="grid grid-cols-3 w-full bg-transparent h-auto p-4">
                <TabsTrigger value="all" className="data-[state=active]:bg-background">
                  All ({notifications.length})
                </TabsTrigger>
                <TabsTrigger value="unread" className="data-[state=active]:bg-background">
                  Unread ({unreadCount})
                </TabsTrigger>
                <TabsTrigger value="high" className="data-[state=active]:bg-background">
                  High Priority ({notifications.filter(n => n.priority === 'high').length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={filter} className="mt-0">
              <ScrollArea className="h-[600px]">
                {filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-96 text-center">
                    <Bell className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No notifications</h3>
                    <p className="text-muted-foreground">
                      {filter === 'all' ? 'You have no notifications at the moment' : 
                       filter === 'unread' ? 'All notifications have been read' : 
                       'No high priority notifications'}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    <AnimatePresence>
                      {filteredNotifications.map((notification, index) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -100 }}
                          transition={{ delay: index * 0.05 }}
                          className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${
                            notification.isRead 
                              ? 'bg-muted/30 hover:bg-muted/50' 
                              : 'bg-background hover:bg-muted/30 border-primary/20'
                          }`}
                        >
                          <div className={`p-2 rounded-full ${getNotificationColor(notification.type, notification.priority)} text-white flex-shrink-0`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className={`font-medium ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {notification.title}
                                  </h4>
                                  {getPriorityBadge(notification.priority)}
                                  {!notification.isRead && (
                                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                                  )}
                                </div>
                                <p className={`text-sm ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                                  {notification.message}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(notification.timestamp).toLocaleString()}
                                </p>
                                {notification.data && notification.data.amount && (
                                  <Badge variant="outline" className="mt-2">
                                    ₹{notification.data.amount}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex gap-1">
                                {!notification.isRead && (
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => markAsRead(notification.id)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <CheckCircle className="h-3 w-3" />
                                  </Button>
                                )}
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => deleteNotification(notification.id)}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};