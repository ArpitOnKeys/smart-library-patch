
import { useState, useEffect } from 'react';
import { LoginPage } from '@/components/auth/LoginPage';
import { auth } from '@/lib/database';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = () => {
      setIsAuthenticated(auth.isAuthenticated());
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    auth.logout();
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading PATCH...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">PATCH - The Smart Library</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Welcome to PATCH Dashboard</h2>
          <p className="text-muted-foreground mb-8">
            Your Smart Library Management System is ready to use!
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-card p-6 rounded-lg border shadow-sm">
              <h3 className="text-xl font-semibold mb-2">🧑‍🎓 Student Panel</h3>
              <p className="text-muted-foreground text-sm">
                Manage admissions, student data, and fee tracking
              </p>
            </div>
            
            <div className="bg-card p-6 rounded-lg border shadow-sm">
              <h3 className="text-xl font-semibold mb-2">⏳ Due Fees Panel</h3>
              <p className="text-muted-foreground text-sm">
                Track overdue payments and send reminders
              </p>
            </div>
            
            <div className="bg-card p-6 rounded-lg border shadow-sm">
              <h3 className="text-xl font-semibold mb-2">💰 Income & Expense</h3>
              <p className="text-muted-foreground text-sm">
                Monitor finances and calculate net income
              </p>
            </div>
          </div>
          
          <div className="mt-8 text-sm text-muted-foreground">
            <p>Next: We'll build the complete dashboard with all panels!</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
