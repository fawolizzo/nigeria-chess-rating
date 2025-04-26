
import { useUser } from "@/contexts/UserContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function Profile() {
  const { currentUser } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            Profile
            <Badge variant="outline" className="ml-2">
              {currentUser.role === 'tournament_organizer' ? 'Organizer' : 'Rating Officer'}
              {currentUser.status !== 'approved' && ' (Pending)'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <h3 className="font-medium text-sm text-muted-foreground">Full Name</h3>
              <p className="text-lg">{currentUser.fullName}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-sm text-muted-foreground">Email</h3>
              <p className="text-lg">{currentUser.email}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-sm text-muted-foreground">Account Status</h3>
              <p className="text-lg capitalize">{currentUser.status || 'Active'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
