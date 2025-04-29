
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, Users } from "lucide-react";
import { format, isValid } from "date-fns";

interface TournamentDashboardCardProps {
  tournament: any;
  onViewDetails: (id: string) => void;
  onManage: (id: string) => void;
}

export function TournamentDashboardCard({ 
  tournament, 
  onViewDetails, 
  onManage 
}: TournamentDashboardCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Format date helper function with proper timezone handling
  const formatDate = (dateInput: string) => {
    try {
      // For YYYY-MM-DD format - create the date in local timezone without UTC conversion
      // This ensures we get the same date that was entered by the user
      const dateParts = dateInput.split('-');
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed in JS
        const day = parseInt(dateParts[2], 10);
        
        const date = new Date(year, month, day);
        return isValid(date) ? format(date, "MMM dd, yyyy") : "Invalid date";
      }
      
      // Fallback for other date formats
      const date = new Date(dateInput);
      return isValid(date) ? format(date, "MMM dd, yyyy") : "Invalid date";
    } catch (error) {
      console.error("Error formatting date:", error, { dateInput });
      return "Invalid date";
    }
  };

  // Use the correct date field based on API response format
  const startDate = tournament.start_date || tournament.startDate;
  const endDate = tournament.end_date || tournament.endDate;
  
  // Status badge color mapping
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ongoing':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'completed':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // Debug the dates in console
  console.log("Tournament dates:", {
    id: tournament.id,
    name: tournament.name,
    rawStartDate: startDate,
    rawEndDate: endDate,
    formattedStart: formatDate(startDate),
    formattedEnd: formatDate(endDate)
  });
  
  return (
    <Card 
      className={`transition-all duration-200 ${
        isHovered ? 'shadow-md border-gray-300' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold">{tournament.name}</h3>
          <Badge className={`${getStatusClass(tournament.status)}`}>
            {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
          </Badge>
        </div>
        
        <div className="space-y-2 mb-4 text-sm text-gray-600">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
            <span>{formatDate(startDate)} - {formatDate(endDate)}</span>
          </div>
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-gray-500" />
            <span>
              {tournament.location}, {tournament.city}, {tournament.state}
            </span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-gray-500" />
            <span>{tournament.time_control}</span>
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-2 text-gray-500" />
            <span>{tournament.rounds} rounds</span>
          </div>
        </div>
        
        <div className="flex space-x-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(tournament.id)}
            className="flex-1"
          >
            View Details
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => onManage(tournament.id)}
            className="flex-1 bg-nigeria-green hover:bg-nigeria-green-dark"
          >
            Manage
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
