import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROGate } from '@/features/auth/guards/RoleGate';
import {
  approveOrganizer,
  getPendingOrganizers,
} from '@/features/auth/api/approveOrganizer';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X, Clock, Mail, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface PendingOrganizer {
  id: string;
  email: string;
  state: string | null;
  status: string;
  created_at: string;
}

export default function OrganizersPage() {
  return (
    <ROGate>
      <OrganizersContent />
    </ROGate>
  );
}

function OrganizersContent() {
  const [pendingOrganizers, setPendingOrganizers] = useState<
    PendingOrganizer[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const { user } = useAuth();

  const fetchPendingOrganizers = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getPendingOrganizers(user.id);

      if (result.success) {
        setPendingOrganizers(result.data);
      } else {
        setError(result.error || 'Failed to fetch pending organizers');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (
    userId: string,
    status: 'active' | 'rejected'
  ) => {
    if (!user?.id) return;

    setProcessingIds((prev) => new Set(prev).add(userId));

    try {
      const result = await approveOrganizer({
        userId,
        status,
        approvedBy: user.id,
      });

      if (result.success) {
        // Remove the organizer from the pending list
        setPendingOrganizers((prev) => prev.filter((org) => org.id !== userId));
      } else {
        setError(result.error || 'Failed to process approval');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  useEffect(() => {
    fetchPendingOrganizers();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Organizer Management</h1>
        <p className="text-gray-600 mt-2">
          Review and approve Tournament Organizer account requests
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Approvals
              <Badge variant="secondary">{pendingOrganizers.length}</Badge>
            </CardTitle>
            <CardDescription>
              Tournament Organizer accounts waiting for approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingOrganizers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No pending organizer accounts</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingOrganizers.map((organizer) => (
                  <div
                    key={organizer.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{organizer.email}</span>
                        <Badge variant="outline">Pending</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {organizer.state && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{organizer.state}</span>
                          </div>
                        )}
                        <span>
                          Registered:{' '}
                          {format(
                            new Date(organizer.created_at),
                            'MMM d, yyyy'
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApproval(organizer.id, 'rejected')}
                        disabled={processingIds.has(organizer.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {processingIds.has(organizer.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApproval(organizer.id, 'active')}
                        disabled={processingIds.has(organizer.id)}
                      >
                        {processingIds.has(organizer.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
