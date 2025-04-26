
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu, User, LogOut } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useSupabaseAuth } from "@/services/auth/useSupabaseAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { useToast } from "@/hooks/use-toast";
import { CircleDot } from "lucide-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser, logout } = useUser();
  const { signOut } = useSupabaseAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    try {
      logMessage(LogLevel.INFO, 'Navbar', 'User logging out', { 
        userId: currentUser?.id 
      });
      
      // Set isOpen to false immediately to avoid UI issues during logout
      setIsOpen(false);
      
      await signOut().catch((error) => {
        logMessage(LogLevel.ERROR, 'Navbar', 'Error during Supabase sign out', { 
          error: error instanceof Error ? error.message : String(error) 
        });
      });
      
      // Call the logout function which will clear currentUser
      logout();
      
      try {
        localStorage.removeItem('sb-caagbqzwkgfhtzyizyzy-auth-token');
      } catch (e) {
        // Ignore localStorage errors
      }
      
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      
      // Navigate to login after a brief delay to allow state updates
      setTimeout(() => {
        navigate("/login");
      }, 100);
    } catch (error) {
      logMessage(LogLevel.ERROR, 'Navbar', 'Error during logout', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      toast({
        title: "Logout Error",
        description: "There was a problem logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Safely determine dashboard link, with a default
  const dashboardLink = currentUser?.role === 'tournament_organizer' 
    ? '/organizer-dashboard' 
    : '/officer-dashboard';

  // Get display name safely
  const displayName = currentUser?.fullName || 'User';
  // Get first letter for avatar safely
  const avatarInitial = displayName ? displayName.charAt(0).toUpperCase() : 'U';
  // Get role text safely
  const roleText = currentUser?.role === 'tournament_organizer' ? 'Organizer' : 'Rating Officer';
  // Get approval status safely
  const pendingText = currentUser?.status !== 'approved' ? ' (Pending)' : '';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background">
      <div className="container flex h-16 items-center justify-between px-4 max-w-7xl mx-auto">
        <div className="flex-1"></div>
        
        <nav className="hidden md:flex items-center space-x-1">
          <Link to="/">
            <Button variant={isActive('/') ? "default" : "ghost"} size="sm">Home</Button>
          </Link>
          <Link to="/tournaments">
            <Button variant={isActive('/tournaments') ? "default" : "ghost"} size="sm">Tournaments</Button>
          </Link>
          <Link to="/players">
            <Button variant={isActive('/players') ? "default" : "ghost"} size="sm">Players</Button>
          </Link>
          <Link to="/about">
            <Button variant={isActive('/about') ? "default" : "ghost"} size="sm">About</Button>
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 flex items-center gap-2" size="sm">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-nigeria-green text-white">
                      {avatarInitial}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden sm:inline">{displayName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{displayName}</span>
                    <span className="text-xs text-muted-foreground">
                      {roleText}
                      {pendingText}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => navigate(dashboardLink)}
                  className={isActive(dashboardLink) 
                    ? "bg-accent text-accent-foreground font-medium flex items-center justify-between" 
                    : "flex items-center justify-between"}
                >
                  <div className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Dashboard
                  </div>
                  {isActive(dashboardLink) && (
                    <CircleDot className="text-green-500 h-4 w-4" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-500" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Log In</Button>
              </Link>
              <Link to="/register">
                <Button className="bg-nigeria-green hover:bg-nigeria-green-dark text-white" size="sm">Register</Button>
              </Link>
            </>
          )}
        </div>

        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col space-y-4 mt-6">
                <Link to="/" onClick={() => setIsOpen(false)}>
                  <Button 
                    variant={isActive('/') ? "default" : "ghost"} 
                    className="w-full justify-start"
                  >
                    Home
                  </Button>
                </Link>
                <Link to="/tournaments" onClick={() => setIsOpen(false)}>
                  <Button 
                    variant={isActive('/tournaments') ? "default" : "ghost"} 
                    className="w-full justify-start"
                  >
                    Tournaments
                  </Button>
                </Link>
                <Link to="/players" onClick={() => setIsOpen(false)}>
                  <Button 
                    variant={isActive('/players') ? "default" : "ghost"} 
                    className="w-full justify-start"
                  >
                    Players
                  </Button>
                </Link>
                <Link to="/about" onClick={() => setIsOpen(false)}>
                  <Button 
                    variant={isActive('/about') ? "default" : "ghost"} 
                    className="w-full justify-start"
                  >
                    About
                  </Button>
                </Link>
                
                {currentUser ? (
                  <>
                    <Link to={dashboardLink} onClick={() => setIsOpen(false)}>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start bg-nigeria-green hover:bg-nigeria-green-dark text-white"
                      >
                        {roleText} Dashboard
                      </Button>
                    </Link>
                    
                    <div className="py-2 flex items-center px-2">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarFallback className="bg-nigeria-green text-white">
                          {avatarInitial}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{displayName}</div>
                        <div className="text-xs text-muted-foreground">
                          {roleText}
                          {pendingText}
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      variant="destructive" 
                      className="w-full mt-auto"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </Button>
                  </>
                ) : (
                  <div className="flex space-x-2 mt-4">
                    <Link to="/login" onClick={() => setIsOpen(false)} className="flex-1">
                      <Button variant="outline" className="w-full">Log In</Button>
                    </Link>
                    <Link to="/register" onClick={() => setIsOpen(false)} className="flex-1">
                      <Button className="w-full bg-nigeria-green hover:bg-nigeria-green-dark text-white">Register</Button>
                    </Link>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
