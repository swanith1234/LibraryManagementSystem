import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Truck, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

export default function AdminServices() {
  const navigate = useNavigate();

  const services = [
    {
      id: 'payment',
      title: 'Payment Service',
      description: 'Manage payment processing for library fines and fees',
      icon: CreditCard,
      status: 'Available',
      route: '/admin/services/payment',
    },
    {
      id: 'delivery',
      title: 'Delivery Service',
      description: 'Configure book delivery and pickup services',
      icon: Truck,
      status: 'Available',
      route: '/admin/services/delivery',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Microservices</h1>
        <p className="text-muted-foreground">Manage optional library services</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {services.map((service) => (
          <Card key={service.id} className="hover-scale">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <service.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{service.title}</CardTitle>
                    <Badge variant="secondary" className="mt-1">
                      {service.status}
                    </Badge>
                  </div>
                </div>
              </div>
              <CardDescription className="mt-3">{service.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate(service.route)} className="w-full">
                Configure Service
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
