import React from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle, MessageSquare, Info } from 'lucide-react';

const HelpAndSupport: React.FC = () => {
  return (
    <div className="mt-8 flex justify-center">
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <Button variant="link" size="sm" className="h-auto p-0 text-muted-foreground hover:text-foreground">
          <HelpCircle className="h-4 w-4 mr-1" />
          Help Center
        </Button>
        <Button variant="link" size="sm" className="h-auto p-0 text-muted-foreground hover:text-foreground">
          <MessageSquare className="h-4 w-4 mr-1" />
          Feedback
        </Button>
        <Button variant="link" size="sm" className="h-auto p-0 text-muted-foreground hover:text-foreground">
          <Info className="h-4 w-4 mr-1" />
          About
        </Button>
      </div>
    </div>
  );
};

export default HelpAndSupport;