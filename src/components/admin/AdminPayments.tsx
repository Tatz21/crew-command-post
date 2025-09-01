import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, Plus } from 'lucide-react';

type Payment = {
  id: string;
  booking_id: string;
  agent_id: string;
  amount: number;
  payment_date: string;
  payment_status: string;
  payment_method: string;
  transaction_id: string | null;
  created_at: string;
};

type Booking = {
  id: string;
  booking_reference: string;
  passenger_name: string;
};

type Agent = {
  id: string;
  agent_code: string;
  company_name: string;
};

export const AdminPayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [formData, setFormData] = useState({
    booking_id: '',
    agent_id: '',
    amount: 0,
    payment_method: 'cash',
    payment_status: 'pending',
    transaction_id: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchPayments();
    fetchBookings();
    fetchAgents();
  }, []);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          bookings!inner(booking_reference, passenger_name),
          agents!inner(agent_code, company_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      toast({
        title: "Error fetching payments",
        description: "Failed to load payments data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, booking_reference, passenger_name');

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('id, agent_code, company_name')
        .eq('status', 'active');

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingPayment) {
        const { error } = await supabase
          .from('payments')
          .update(formData)
          .eq('id', editingPayment.id);

        if (error) throw error;

        toast({
          title: "Payment updated successfully",
          description: "The payment information has been updated.",
        });
      } else {
        const { error } = await supabase
          .from('payments')
          .insert(formData);

        if (error) throw error;

        toast({
          title: "Payment created successfully",
          description: "New payment has been added to the system.",
        });
      }

      setIsDialogOpen(false);
      setEditingPayment(null);
      resetForm();
      fetchPayments();
    } catch (error) {
      toast({
        title: "Error saving payment",
        description: "Failed to save payment information.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setFormData({
      booking_id: payment.booking_id,
      agent_id: payment.agent_id,
      amount: payment.amount,
      payment_method: payment.payment_method,
      payment_status: payment.payment_status,
      transaction_id: payment.transaction_id || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment?')) return;

    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Payment deleted successfully",
        description: "The payment has been removed from the system.",
      });
      fetchPayments();
    } catch (error) {
      toast({
        title: "Error deleting payment",
        description: "Failed to delete the payment.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      booking_id: '',
      agent_id: '',
      amount: 0,
      payment_method: 'cash',
      payment_status: 'pending',
      transaction_id: ''
    });
  };

  const openCreateDialog = () => {
    setEditingPayment(null);
    resetForm();
    setIsDialogOpen(true);
  };

  if (loading) {
    return <div className="text-center py-8">Loading payments...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Payments Management</CardTitle>
            <CardDescription>
              Manage all payments in the system
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingPayment ? 'Edit Payment' : 'Create New Payment'}
                </DialogTitle>
                <DialogDescription>
                  {editingPayment ? 'Update payment information' : 'Add a new payment to the system'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="booking_id">Booking</Label>
                    <Select value={formData.booking_id} onValueChange={(value) => setFormData({ ...formData, booking_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select booking" />
                      </SelectTrigger>
                      <SelectContent>
                        {bookings.map((booking) => (
                          <SelectItem key={booking.id} value={booking.id}>
                            {booking.booking_reference} - {booking.passenger_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agent_id">Agent</Label>
                    <Select value={formData.agent_id} onValueChange={(value) => setFormData({ ...formData, agent_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select agent" />
                      </SelectTrigger>
                      <SelectContent>
                        {agents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.agent_code} - {agent.company_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_method">Payment Method</Label>
                    <Select value={formData.payment_method} onValueChange={(value) => setFormData({ ...formData, payment_method: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_status">Payment Status</Label>
                    <Select value={formData.payment_status} onValueChange={(value) => setFormData({ ...formData, payment_status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transaction_id">Transaction ID</Label>
                    <Input
                      id="transaction_id"
                      value={formData.transaction_id}
                      onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingPayment ? 'Update Payment' : 'Create Payment'}
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
              <TableHead>Booking Reference</TableHead>
              <TableHead>Passenger</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Transaction ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-mono">
                  {(payment as any).bookings?.booking_reference}
                </TableCell>
                <TableCell>{(payment as any).bookings?.passenger_name}</TableCell>
                <TableCell>{(payment as any).agents?.company_name}</TableCell>
                <TableCell>₹{payment.amount.toLocaleString()}</TableCell>
                <TableCell className="capitalize">{payment.payment_method.replace('_', ' ')}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    payment.payment_status === 'completed' 
                      ? 'bg-green-100 text-green-800'
                      : payment.payment_status === 'failed'
                      ? 'bg-red-100 text-red-800' 
                      : payment.payment_status === 'refunded'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {payment.payment_status}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {payment.transaction_id || 'N/A'}
                </TableCell>
                <TableCell>
                  {new Date(payment.payment_date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(payment)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(payment.id)}
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