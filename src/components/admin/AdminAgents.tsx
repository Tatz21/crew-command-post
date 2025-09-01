import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, Plus } from 'lucide-react';

type Agent = {
  id: string;
  agent_code: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  status: string;
  commission_rate: number;
  created_at: string;
};

export const AdminAgents = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    commission_rate: 5.0,
    address: '',
    city: '',
    state: '',
    country: '',
    pincode: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      toast({
        title: "Error fetching agents",
        description: "Failed to load agents data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingAgent) {
        const { error } = await supabase
          .from('agents')
          .update(formData)
          .eq('id', editingAgent.id);

        if (error) throw error;

        toast({
          title: "Agent updated successfully",
          description: "The agent information has been updated.",
        });
      } else {
        // Generate agent code
        const { data: codeData, error: codeError } = await supabase
          .rpc('generate_agent_code');

        if (codeError) throw codeError;

        const { error } = await supabase
          .from('agents')
          .insert({
            ...formData,
            agent_code: codeData,
            user_id: '00000000-0000-0000-0000-000000000000', // Placeholder user_id for admin-created agents
          });

        if (error) throw error;

        toast({
          title: "Agent created successfully",
          description: "New agent has been added to the system.",
        });
      }

      setIsDialogOpen(false);
      setEditingAgent(null);
      resetForm();
      fetchAgents();
    } catch (error) {
      toast({
        title: "Error saving agent",
        description: "Failed to save agent information.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setFormData({
      company_name: agent.company_name,
      contact_person: agent.contact_person,
      email: agent.email,
      phone: agent.phone,
      commission_rate: agent.commission_rate,
      address: '',
      city: '',
      state: '',
      country: '',
      pincode: ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;

    try {
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Agent deleted successfully",
        description: "The agent has been removed from the system.",
      });
      fetchAgents();
    } catch (error) {
      toast({
        title: "Error deleting agent",
        description: "Failed to delete the agent.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      company_name: '',
      contact_person: '',
      email: '',
      phone: '',
      commission_rate: 5.0,
      address: '',
      city: '',
      state: '',
      country: '',
      pincode: ''
    });
  };

  const openCreateDialog = () => {
    setEditingAgent(null);
    resetForm();
    setIsDialogOpen(true);
  };

  if (loading) {
    return <div className="text-center py-8">Loading agents...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Agents Management</CardTitle>
            <CardDescription>
              Manage travel agents in the system
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Agent
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingAgent ? 'Edit Agent' : 'Create New Agent'}
                </DialogTitle>
                <DialogDescription>
                  {editingAgent ? 'Update agent information' : 'Add a new travel agent to the system'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company Name</Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_person">Contact Person</Label>
                    <Input
                      id="contact_person"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="commission_rate">Commission Rate (%)</Label>
                    <Input
                      id="commission_rate"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.commission_rate}
                      onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingAgent ? 'Update Agent' : 'Create Agent'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent Code</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Commission Rate</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents.map((agent) => (
              <TableRow key={agent.id}>
                <TableCell className="font-mono">{agent.agent_code}</TableCell>
                <TableCell>{agent.company_name}</TableCell>
                <TableCell>{agent.contact_person}</TableCell>
                <TableCell>{agent.email}</TableCell>
                <TableCell>{agent.phone}</TableCell>
                <TableCell>{agent.commission_rate}%</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    agent.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {agent.status}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(agent)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(agent.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};