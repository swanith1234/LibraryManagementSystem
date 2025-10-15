import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AdminSettings() {
  const handleSave = () => {
    toast.success('Settings saved successfully');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure library system settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Borrowing Rules</CardTitle>
          <CardDescription>Set borrowing limits and durations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="max-books">Maximum Books Per User</Label>
              <Input id="max-books" type="number" defaultValue="5" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="borrow-days">Borrow Period (Days)</Label>
              <Input id="borrow-days" type="number" defaultValue="14" />
            </div>
          </div>
          <Button onClick={handleSave}>Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fine Configuration</CardTitle>
          <CardDescription>Set late return fines</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fine-amount">Daily Fine Amount ($)</Label>
              <Input id="fine-amount" type="number" step="0.01" defaultValue="0.50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-fine">Maximum Fine ($)</Label>
              <Input id="max-fine" type="number" step="0.01" defaultValue="25.00" />
            </div>
          </div>
          <Button onClick={handleSave}>Save Changes</Button>
        </CardContent>
      </Card>
    </div>
  );
}
