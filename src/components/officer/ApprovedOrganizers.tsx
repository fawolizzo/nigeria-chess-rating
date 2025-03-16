
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/contexts/UserContext";
import { Calendar, MapPin, User } from "lucide-react";

const ApprovedOrganizers: React.FC = () => {
  const { users } = useUser();
  
  // Filter tournament organizers with approved status
  const approvedOrganizers = users.filter(
    (user) => user.role === "tournament_organizer" && user.status === "approved"
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Approved Organizers</CardTitle>
        <CardDescription>
          Organizers that have been approved and can create tournaments
        </CardDescription>
      </CardHeader>
      <CardContent>
        {approvedOrganizers.length === 0 ? (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            <div className="flex justify-center mb-4">
              <User className="h-12 w-12 text-gray-400" />
            </div>
            <p>No approved organizers found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {approvedOrganizers.map((organizer) => (
              <div 
                key={organizer.id}
                className="border border-gray-200 dark:border-gray-800 rounded-lg p-4"
              >
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
                  <Badge className="bg-green-100 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                    Approved
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{organizer.state}</span>
                  </div>
                  {organizer.approvalDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>Approved on {new Date(organizer.approvalDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ApprovedOrganizers;
