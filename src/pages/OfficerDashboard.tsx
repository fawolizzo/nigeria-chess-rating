
import { useState, useEffect } from "react";
import { Shield, CheckCircle, XCircle, ChevronDown, Eye } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";

// Mock data for pending organizers
const MOCK_PENDING_ORGANIZERS = [
  {
    id: "1",
    fullName: "John Doe",
    email: "john.doe@example.com",
    phoneNumber: "+234 800 1234 567",
    state: "Lagos",
    registrationDate: "2023-05-12T10:30:00Z",
    status: "pending"
  },
  {
    id: "2",
    fullName: "Jane Smith",
    email: "jane.smith@example.com",
    phoneNumber: "+234 800 7654 321",
    state: "Abuja",
    registrationDate: "2023-05-15T14:45:00Z",
    status: "pending"
  },
  {
    id: "3",
    fullName: "Oluwaseun Adeyemi",
    email: "oluwa.adeyemi@example.com",
    phoneNumber: "+234 812 3456 789",
    state: "Rivers",
    registrationDate: "2023-05-18T09:15:00Z",
    status: "pending"
  }
];

// Mock data for approved organizers
const MOCK_APPROVED_ORGANIZERS = [
  {
    id: "4",
    fullName: "Emmanuel Okonkwo",
    email: "emmanuel.o@example.com",
    phoneNumber: "+234 803 1111 2222",
    state: "Enugu",
    registrationDate: "2023-04-22T10:30:00Z",
    approvalDate: "2023-04-25T15:20:00Z",
    status: "approved"
  },
  {
    id: "5",
    fullName: "Aisha Mohammed",
    email: "aisha.m@example.com",
    phoneNumber: "+234 805 3333 4444",
    state: "Kano",
    registrationDate: "2023-04-28T11:45:00Z",
    approvalDate: "2023-05-01T09:10:00Z",
    status: "approved"
  }
];

const OrganizerCard = ({ organizer, onApprove, onReject, isApproved = false }) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{organizer.fullName}</CardTitle>
            <CardDescription>{organizer.email}</CardDescription>
          </div>
          <Badge variant={isApproved ? "success" : "outline"} className={isApproved ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" : ""}>
            {isApproved ? "Approved" : "Pending"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
          <span>State: {organizer.state}</span>
          <span>{isApproved ? "Approved on:" : "Applied on:"} {formatDate(isApproved ? organizer.approvalDate : organizer.registrationDate)}</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsViewDetailsOpen(true)}
          className="text-xs"
        >
          <Eye className="mr-1 h-3 w-3" />
          View Details
        </Button>
        
        {!isApproved && (
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={() => onReject(organizer.id)}
              className="text-xs"
            >
              <XCircle className="mr-1 h-3 w-3" />
              Reject
            </Button>
            <Button 
              size="sm" 
              variant="default" 
              onClick={() => onApprove(organizer.id)}
              className="text-xs"
            >
              <CheckCircle className="mr-1 h-3 w-3" />
              Approve
            </Button>
          </div>
        )}
      </CardFooter>
      
      <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Organizer Details</DialogTitle>
            <DialogDescription>
              Full information about the tournament organizer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="grid grid-cols-3 gap-2 text-sm">
              <span className="font-medium text-gray-500 dark:text-gray-400">Full Name:</span>
              <span className="col-span-2">{organizer.fullName}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <span className="font-medium text-gray-500 dark:text-gray-400">Email:</span>
              <span className="col-span-2">{organizer.email}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <span className="font-medium text-gray-500 dark:text-gray-400">Phone:</span>
              <span className="col-span-2">{organizer.phoneNumber}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <span className="font-medium text-gray-500 dark:text-gray-400">State:</span>
              <span className="col-span-2">{organizer.state}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <span className="font-medium text-gray-500 dark:text-gray-400">Registration Date:</span>
              <span className="col-span-2">{formatDate(organizer.registrationDate)}</span>
            </div>
            {isApproved && (
              <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="font-medium text-gray-500 dark:text-gray-400">Approval Date:</span>
                <span className="col-span-2">{formatDate(organizer.approvalDate)}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsViewDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

const OfficerDashboard = () => {
  const [pendingOrganizers, setPendingOrganizers] = useState(MOCK_PENDING_ORGANIZERS);
  const [approvedOrganizers, setApprovedOrganizers] = useState(MOCK_APPROVED_ORGANIZERS);
  const [activeTab, setActiveTab] = useState("pending");

  const handleApproveOrganizer = (organizerId) => {
    // Find the organizer to approve
    const organizer = pendingOrganizers.find(org => org.id === organizerId);
    
    if (organizer) {
      // Create a copy with approved status and date
      const approvedOrganizer = {
        ...organizer,
        status: "approved",
        approvalDate: new Date().toISOString()
      };
      
      // Update states
      setPendingOrganizers(pendingOrganizers.filter(org => org.id !== organizerId));
      setApprovedOrganizers([approvedOrganizer, ...approvedOrganizers]);
      
      // Show success toast
      toast({
        title: "Organizer Approved",
        description: `${organizer.fullName} has been approved as a tournament organizer.`,
        variant: "default",
      });
    }
  };

  const handleRejectOrganizer = (organizerId) => {
    // Just remove from pending list for now
    setPendingOrganizers(pendingOrganizers.filter(org => org.id !== organizerId));
    
    // Show success toast
    const organizer = pendingOrganizers.find(org => org.id === organizerId);
    toast({
      title: "Organizer Rejected",
      description: `${organizer.fullName}'s application has been rejected.`,
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      <div className="max-w-7xl mx-auto pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Rating Officer Dashboard</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Manage tournament organizers and rating data
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center">
            <Shield className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-blue-600 dark:text-blue-400 font-medium">NCR Rating Officer</span>
          </div>
        </div>
        
        <Tabs defaultValue="pending" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="pending" className="relative">
              Pending Approval
              {pendingOrganizers.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                  {pendingOrganizers.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">Approved Organizers</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="space-y-4">
            {pendingOrganizers.length === 0 ? (
              <div className="text-center py-8">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                  <CheckCircle className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No Pending Requests</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  There are no tournament organizers waiting for approval.
                </p>
              </div>
            ) : (
              <div>
                {pendingOrganizers.map((organizer) => (
                  <OrganizerCard 
                    key={organizer.id}
                    organizer={organizer}
                    onApprove={handleApproveOrganizer}
                    onReject={handleRejectOrganizer}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="approved" className="space-y-4">
            {approvedOrganizers.length === 0 ? (
              <div className="text-center py-8">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                  <Users className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No Approved Organizers</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  There are no approved tournament organizers yet.
                </p>
              </div>
            ) : (
              <div>
                {approvedOrganizers.map((organizer) => (
                  <OrganizerCard 
                    key={organizer.id}
                    organizer={organizer}
                    isApproved={true}
                    onApprove={() => {}}
                    onReject={() => {}}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default OfficerDashboard;
