
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, ChevronDown, User, LogOut } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser, logout } = useUser();
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background">
      <div className="container flex h-16 items-center justify-between px-4 max-w-7xl mx-auto">
        <div className="flex items-center">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
              <img 
                src="/logo.png" 
                alt="Nigerian Chess Rating" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="hidden md:block">
              <h1 className="text-xl font-bold">Nigerian Chess Rating</h1>
            </div>
          </Link>
        </div>
        
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
          
          {currentUser ? (
            <>
              {currentUser.role === 'tournament_organizer' && (
                <Link to="/organizer">
                  <Button 
                    variant={isActive('/organizer') ? "default" : "ghost"} 
                    size="sm" 
                    className="bg-nigeria-green hover:bg-nigeria-green-dark text-white"
                  >
                    Organizer Dashboard
                  </Button>
                </Link>
              )}
              
              {currentUser.role === 'rating_officer' && (
                <Link to="/officer">
                  <Button 
                    variant={isActive('/officer') ? "default" : "ghost"} 
                    size="sm" 
                    className="bg-nigeria-green hover:bg-nigeria-green-dark text-white"
                  >
                    Rating Officer Dashboard
                  </Button>
                </Link>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 flex items-center gap-2" size="sm">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-nigeria-green text-white">
                        {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{currentUser.fullName}</span>
                    <Badge variant="outline" className="ml-1 text-xs">
                      {currentUser.role === 'tournament_organizer' ? 'Organizer' : 'Rating Officer'}
                    </Badge>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center text-red-500" onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
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
        </nav>
        
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
                    {currentUser.role === 'tournament_organizer' && (
                      <Link to="/organizer" onClick={() => setIsOpen(false)}>
                        <Button 
                          variant={isActive('/organizer') ? "default" : "ghost"} 
                          className="w-full justify-start bg-nigeria-green hover:bg-nigeria-green-dark text-white"
                        >
                          Organizer Dashboard
                        </Button>
                      </Link>
                    )}
                    
                    {currentUser.role === 'rating_officer' && (
                      <Link to="/officer" onClick={() => setIsOpen(false)}>
                        <Button 
                          variant={isActive('/officer') ? "default" : "ghost"} 
                          className="w-full justify-start bg-nigeria-green hover:bg-nigeria-green-dark text-white"
                        >
                          Rating Officer Dashboard
                        </Button>
                      </Link>
                    )}
                    
                    <div className="py-2 flex items-center px-2">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarFallback className="bg-nigeria-green text-white">
                          {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{currentUser.fullName}</div>
                        <div className="text-xs text-muted-foreground">
                          {currentUser.role === 'tournament_organizer' ? 'Organizer' : 'Rating Officer'}
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      variant="destructive" 
                      className="w-full mt-auto"
                      onClick={() => {
                        logout();
                        setIsOpen(false);
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex space-x-2 mt-4">
                      <Link to="/login" onClick={() => setIsOpen(false)} className="flex-1">
                        <Button variant="outline" className="w-full">Log In</Button>
                      </Link>
                      <Link to="/register" onClick={() => setIsOpen(false)} className="flex-1">
                        <Button className="w-full bg-nigeria-green hover:bg-nigeria-green-dark text-white">Register</Button>
                      </Link>
                    </div>
                  </>
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
