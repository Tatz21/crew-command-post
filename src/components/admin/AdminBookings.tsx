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

type Booking = {
  id: string;
  booking_reference: string;
  agent_id: string;
  booking_type: 'flight' | 'bus' | 'hotel';
  passenger_name: string;
  passenger_email: string;
  passenger_phone: string;
  from_location: string;
  to_location: string;
  departure_date: string;
  return_date: string | null;
  adult_count: number;
  child_count: number;
  total_amount: number;
  commission_amount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
};

type Agent = {
  id: string;
  agent_code: string;
  company_name: string;
};

export const AdminBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [formData, setFormData] = useState({
    agent_id: '',
    booking_type: 'flight' as 'flight' | 'bus' | 'hotel',
    passenger_name: '',
    passenger_email: '',
    passenger_phone: '',
    from_location: '',
    to_location: '',
    departure_date: '',
    return_date: '',
    adult_count: 1,
    child_count: 0,
    total_amount: 0,
    commission_amount: 0,
    status: 'pending' as 'pending' | 'confirmed' | 'cancelled' | 'completed'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchBookings();
    fetchAgents();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          agents!inner(agent_code, company_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      toast({
        title: "Error fetching bookings",
        description: "Failed to load bookings data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
      if (editingBooking) {
        const { error } = await supabase
          .from('bookings')
          .update(formData)
          .eq('id', editingBooking.id);

        if (error) throw error;

        toast({
          title: "Booking updated successfully",
          description: "The booking information has been updated.",
        });
      } else {
        // Generate booking reference
        const { data: refData, error: refError } = await supabase
          .rpc('generate_booking_reference');

        if (refError) throw refError;

        const { error } = await supabase
          .from('bookings')
          .insert({
            ...formData,
            booking_reference: refData,
          });

        if (error) throw error;

        toast({
          title: "Booking created successfully",
          description: "New booking has been added to the system.",
        });
      }

      setIsDialogOpen(false);
      setEditingBooking(null);
      resetForm();
      fetchBookings();
    } catch (error) {
      toast({
        title: "Error saving booking",
        description: "Failed to save booking information.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (booking: Booking) => {
    setEditingBooking(booking);
    setFormData({
      agent_id: booking.agent_id,
      booking_type: booking.booking_type,
      passenger_name: booking.passenger_name,
      passenger_email: booking.passenger_email,
      passenger_phone: booking.passenger_phone,
      from_location: booking.from_location || '',
      to_location: booking.to_location || '',
      departure_date: booking.departure_date || '',
      return_date: booking.return_date || '',
      adult_count: booking.adult_count,
      child_count: booking.child_count,
      total_amount: booking.total_amount,
      commission_amount: booking.commission_amount,
      status: booking.status
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Booking deleted successfully",
        description: "The booking has been removed from the system.",
      });
      fetchBookings();
    } catch (error) {
      toast({
        title: "Error deleting booking",
        description: "Failed to delete the booking.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      agent_id: '',
      booking_type: 'flight' as 'flight' | 'bus' | 'hotel',
      passenger_name: '',
      passenger_email: '',
      passenger_phone: '',
      from_location: '',
      to_location: '',
      departure_date: '',
      return_date: '',
      adult_count: 1,
      child_count: 0,
      total_amount: 0,
      commission_amount: 0,
      status: 'pending' as 'pending' | 'confirmed' | 'cancelled' | 'completed'
    });
  };

  const openCreateDialog = () => {
    setEditingBooking(null);
    resetForm();
    setIsDialogOpen(true);
  };

  if (loading) {
    return <div className="text-center py-8">Loading bookings...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Bookings Management</CardTitle>
            <CardDescription>
              Manage all travel bookings in the system
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Booking
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingBooking ? 'Edit Booking' : 'Create New Booking'}
                </DialogTitle>
                <DialogDescription>
                  {editingBooking ? 'Update booking information' : 'Add a new booking to the system'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="booking_type">Booking Type</Label>
                    <Select value={formData.booking_type} onValueChange={(value: 'flight' | 'bus' | 'hotel') => setFormData({ ...formData, booking_type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flight">Flight</SelectItem>
                        <SelectItem value="bus">Bus</SelectItem>
                        <SelectItem value="hotel">Hotel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passenger_name">Passenger Name</Label>
                    <Input
                      id="passenger_name"
                      value={formData.passenger_name}
                      onChange={(e) => setFormData({ ...formData, passenger_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passenger_email">Passenger Email</Label>
                    <Input
                      id="passenger_email"
                      type="email"
                      value={formData.passenger_email}
                      onChange={(e) => setFormData({ ...formData, passenger_email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passenger_phone">Passenger Phone</Label>
                    <Input
                      id="passenger_phone"
                      value={formData.passenger_phone}
                      onChange={(e) => setFormData({ ...formData, passenger_phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="from_location">From Location</Label>
                    <Input
                      id="from_location"
                      value={formData.from_location}
                      onChange={(e) => setFormData({ ...formData, from_location: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="to_location">To Location</Label>
                    <Input
                      id="to_location"
                      value={formData.to_location}
                      onChange={(e) => setFormData({ ...formData, to_location: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="departure_date">Departure Date</Label>
                    <Input
                      id="departure_date"
                      type="date"
                      value={formData.departure_date}
                      onChange={(e) => setFormData({ ...formData, departure_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="return_date">Return Date</Label>
                    <Input
                      id="return_date"
                      type="date"
                      value={formData.return_date}
                      onChange={(e) => setFormData({ ...formData, return_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adult_count">Adult Count</Label>
                    <Input
                      id="adult_count"
                      type="number"
                      min="1"
                      value={formData.adult_count}
                      onChange={(e) => setFormData({ ...formData, adult_count: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="child_count">Child Count</Label>
                    <Input
                      id="child_count"
                      type="number"
                      min="0"
                      value={formData.child_count}
                      onChange={(e) => setFormData({ ...formData, child_count: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="total_amount">Total Amount</Label>
                    <Input
                      id="total_amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.total_amount}
                      onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="commission_amount">Commission Amount</Label>
                    <Input
                      id="commission_amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.commission_amount}
                      onChange={(e) => setFormData({ ...formData, commission_amount: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value: 'pending' | 'confirmed' | 'cancelled' | 'completed') => setFormData({ ...formData, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingBooking ? 'Update Booking' : 'Create Booking'}
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
              <TableHead>Reference</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Passenger</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="font-mono">{booking.booking_reference}</TableCell>
                <TableCell>{(booking as any).agents?.company_name}</TableCell>
                <TableCell className="capitalize">{booking.booking_type}</TableCell>
                <TableCell>{booking.passenger_name}</TableCell>
                <TableCell>
                  {booking.from_location && booking.to_location 
                    ? `${booking.from_location} → ${booking.to_location}` 
                    : 'N/A'}
                </TableCell>
                <TableCell>
                  {booking.departure_date ? new Date(booking.departure_date).toLocaleDateString() : 'N/A'}
                </TableCell>
                <TableCell>₹{booking.total_amount.toLocaleString()}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    booking.status === 'confirmed' 
                      ? 'bg-green-100 text-green-800'
                      : booking.status === 'cancelled'
                      ? 'bg-red-100 text-red-800' 
                      : booking.status === 'completed'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {booking.status}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(booking)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(booking.id)}
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