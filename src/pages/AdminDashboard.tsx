import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { AdminAgents } from '@/components/admin/AdminAgents';
import { AdminBookings } from '@/components/admin/AdminBookings';
import { AdminPayments } from '@/components/admin/AdminPayments';
import { AdminAuth } from '@/components/admin/AdminAuth';

const AdminDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'agent' | null>(null);
  const [agentData, setAgentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check user role when session changes
        if (session?.user) {
          setTimeout(() => {
            checkUserAccess(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
          setAgentData(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkUserAccess(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserAccess = async (userId: string) => {
    try {
      // First check if user is admin
      const { data: adminData, error: adminError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (adminError) {
        console.error('Error checking admin status:', adminError);
      }

      if (adminData) {
        setUserRole('admin');
        setLoading(false);
        return;
      }

      // If not admin, check if user is agent
      const { data: agentData, error: agentError } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (agentError) {
        console.error('Error checking agent status:', agentError);
        setUserRole(null);
      } else if (agentData) {
        setUserRole('agent');
        setAgentData(agentData);
      } else {
        setUserRole(null);
      }
    } catch (error) {
      console.error('Error checking user access:', error);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of the admin dashboard.",
      });
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AdminAuth />;
  }

  if (!userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>
              You don't have access to this dashboard. Please contact your administrator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSignOut} variant="outline" className="w-full">
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {userRole === 'admin' ? 'Admin Dashboard' : 'Agent Dashboard'}
            </h1>
            {userRole === 'agent' && agentData && (
              <p className="text-sm text-muted-foreground">
                {agentData.company_name} ({agentData.agent_code})
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user.email}
            </span>
            <Button onClick={handleSignOut} variant="outline" size="sm">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue={userRole === 'admin' ? 'agents' : 'bookings'} className="space-y-6">
          <TabsList className={`grid w-full ${userRole === 'admin' ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {userRole === 'admin' && <TabsTrigger value="agents">Agents</TabsTrigger>}
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>
          
          {userRole === 'admin' && (
            <TabsContent value="agents">
              <AdminAgents />
            </TabsContent>
          )}
          
          <TabsContent value="bookings">
            <AdminBookings />
          </TabsContent>
          
          <TabsContent value="payments">
            <AdminPayments />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;