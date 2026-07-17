import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

const UnauthorizedPage = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="text-center space-y-4">
      <ShieldAlert className="h-16 w-16 text-destructive mx-auto" />
      <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
      <p className="text-muted-foreground">You don't have permission to access this page.</p>
      <Button asChild>
        <Link to="/login">Back to Login</Link>
      </Button>
    </div>
  </div>
);

export default UnauthorizedPage;
