import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldX, ArrowLeft } from 'lucide-react';

const AccessDenied: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background gradient-mesh">
      <div className="text-center">
        <ShieldX className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">You don't have permission to access this page.</p>
        <Link to="/dashboard">
          <Button><ArrowLeft className="mr-2 h-4 w-4" /> Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
};

export default AccessDenied;
