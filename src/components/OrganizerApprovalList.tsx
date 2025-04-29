import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCheck, UserX, User, MapPin, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface OrganizerApprovalListProps {
  pendingOrganizers: any[];
  onApprove: (userId: string) => void;
  onReject: (userId: string) => void;
}

const OrganizerApprovalList: React.FC<OrganizerApprovalListProps> = ({
  pendingOrganizers,
  onApprove,
  onReject
}) => {
  const { toast } = useToast();

  const handleApprove = (userId: string) => {
    try {
      // Call the parent component's handler which will update the context
      onApprove(userId);
      
      toast({
        title: "Organizer Approved",
        description: "The organizer has been approved successfully.",
      });
    } catch (error) {
      console.error("Error approving organizer:", error);
      toast({
        title: "Approval Failed",
        description: "There was an error approving the organizer. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReject = (userId: string) => {
    try {
      // Call the parent component's handler which will update the context
      onReject(userId);
      
      toast({
        title: "Organizer Rejected",
        description: "The organizer has been rejected.",
      });
    } catch (error) {
      console.error("Error rejecting organizer:", error);
      toast({
        title: "Rejection Failed",
        description: "There was an error rejecting the organizer. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (pendingOrganizers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Organizers</CardTitle>
          <CardDescription>
            No pending organizer registrations at this time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-full mb-4">
              <UserCheck className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-2">All organizer registrations have been processed</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Organizers</CardTitle>
        <CardDescription>
          {pendingOrganizers.length} organizer{pendingOrganizers.length !== 1 ? 's' : ''} waiting for approval
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingOrganizers.map(organizer => (
            <div key={organizer.id} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {organizer.fullName}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {organizer.email}
                  </p>
                </div>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800">
                  Pending
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{organizer.state}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>Registered on {new Date(organizer.registrationDate).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-800 dark:hover:bg-red-900/20"
                  onClick={() => handleReject(organizer.id)}
                >
                  <UserX className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleApprove(organizer.id)}
                >
                  <UserCheck className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrganizerApprovalList;
