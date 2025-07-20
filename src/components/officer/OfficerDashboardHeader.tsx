import { Button } from '@/components/ui/button';
import { RefreshCw, Beaker } from 'lucide-react';
import { Link } from 'react-router-dom';

interface OfficerDashboardHeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}

const OfficerDashboardHeader = ({
  onRefresh,
  isRefreshing,
}: OfficerDashboardHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h1 className="text-3xl font-bold">Rating Officer Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Manage tournaments, players, and rating calculations
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={isRefreshing}
          onClick={onRefresh}
          className="h-9"
        >
          {isRefreshing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Data
            </>
          )}
        </Button>

        <Button variant="secondary" size="sm" asChild className="h-9">
          <Link to="/system-testing">
            <Beaker className="mr-2 h-4 w-4" />
            System Testing
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default OfficerDashboardHeader;
