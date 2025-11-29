import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { format } from 'date-fns';
import { useUser } from '@/contexts/user/index';
import { Badge } from '@/components/ui/badge';

const ApprovedOrganizers: React.FC = () => {
  const { users } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [approvedOrganizers, setApprovedOrganizers] = useState<any[]>([]);

  useEffect(() => {
    // Filter approved tournament organizers
    const filtered = users.filter(
      (user) =>
        user.role === 'tournament_organizer' && user.status === 'approved'
    );
    setApprovedOrganizers(filtered);
  }, [users]);

  // Filter organizers based on search term
  const filteredOrganizers = approvedOrganizers.filter(
    (organizer) =>
      organizer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      organizer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      organizer.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          Approved Tournament Organizers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or state..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {filteredOrganizers.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No approved tournament organizers found
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Approval Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrganizers.map((organizer) => (
                  <TableRow key={organizer.id}>
                    <TableCell className="font-medium">
                      {organizer.fullName}
                    </TableCell>
                    <TableCell>{organizer.email}</TableCell>
                    <TableCell>{organizer.state}</TableCell>
                    <TableCell>
                      {organizer.approvalDate
                        ? format(
                            new Date(organizer.approvalDate),
                            'MMM dd, yyyy'
                          )
                        : 'Unknown date'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        Approved
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ApprovedOrganizers;
