
import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { detectPlatform } from '@/utils/storageSync';
import CrossPlatformTester from '@/components/CrossPlatformTester';
import SyncStatusIndicator from '@/components/SyncStatusIndicator';
import { Database, ArrowLeft, Smartphone, Tablet, Laptop } from 'lucide-react';

const CrossPlatformTesting: React.FC = () => {
  const platform = detectPlatform();
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container px-4 py-8 mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cross-Platform Testing</h1>
            <p className="text-muted-foreground mt-1">
              Test the Nigerian Chess Rating system across different devices
            </p>
          </div>
          
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Smartphone className="h-5 w-5 mr-2 text-blue-500" />
                Mobile Testing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Test on smartphones to verify rating calculations and data syncing works properly on small screens.
              </p>
            </CardContent>
            <CardFooter className="pt-2">
              <Badge variant={platform.isMobile ? "default" : "outline"}>
                {platform.isMobile ? "Current Device" : "Not Current Device"}
              </Badge>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Tablet className="h-5 w-5 mr-2 text-purple-500" />
                Tablet Testing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Verify that tournament management, player registration, and rating processing work correctly on tablets.
              </p>
            </CardContent>
            <CardFooter className="pt-2">
              <Badge variant={platform.isTablet ? "default" : "outline"}>
                {platform.isTablet ? "Current Device" : "Not Current Device"}
              </Badge>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Laptop className="h-5 w-5 mr-2 text-green-500" />
                Desktop Testing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Test complete tournament management, rating officer functions, and organizer approvals on desktops.
              </p>
            </CardContent>
            <CardFooter className="pt-2">
              <Badge variant={platform.isDesktop ? "default" : "outline"}>
                {platform.isDesktop ? "Current Device" : "Not Current Device"}
              </Badge>
            </CardFooter>
          </Card>
        </div>
        
        <Tabs defaultValue="diagnostics" className="space-y-4">
          <TabsList>
            <TabsTrigger value="diagnostics">System Diagnostics</TabsTrigger>
            <TabsTrigger value="testing">Testing Checklist</TabsTrigger>
          </TabsList>
          
          <TabsContent value="diagnostics" className="space-y-4">
            <CrossPlatformTester />
          </TabsContent>
          
          <TabsContent value="testing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cross-Platform Testing Checklist</CardTitle>
                <CardDescription>
                  Verify these key functions across all device types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">All Platforms (Desktop, Tablet, Mobile)</h3>
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <input type="checkbox" id="test1" className="mt-1 mr-2" />
                      <label htmlFor="test1" className="text-sm">
                        <span className="font-medium">Login & Authentication</span>: Verify login works and stays logged in
                      </label>
                    </div>
                    
                    <div className="flex items-start">
                      <input type="checkbox" id="test2" className="mt-1 mr-2" />
                      <label htmlFor="test2" className="text-sm">
                        <span className="font-medium">Data Synchronization</span>: Ratings change on one device and sync to others
                      </label>
                    </div>
                    
                    <div className="flex items-start">
                      <input type="checkbox" id="test3" className="mt-1 mr-2" />
                      <label htmlFor="test3" className="text-sm">
                        <span className="font-medium">Correct Rating Application</span>: Verify rating changes apply to correct rating type
                      </label>
                    </div>
                    
                    <div className="flex items-start">
                      <input type="checkbox" id="test4" className="mt-1 mr-2" />
                      <label htmlFor="test4" className="text-sm">
                        <span className="font-medium">Performance Charts</span>: Rating charts load and display correctly
                      </label>
                    </div>
                  </div>
                  
                  <h3 className="font-medium text-lg mt-4">Specific Device Tests</h3>
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <input type="checkbox" id="test5" className="mt-1 mr-2" />
                      <label htmlFor="test5" className="text-sm">
                        <span className="font-medium">Mobile</span>: Test pairing & result recording on small screens
                      </label>
                    </div>
                    
                    <div className="flex items-start">
                      <input type="checkbox" id="test6" className="mt-1 mr-2" />
                      <label htmlFor="test6" className="text-sm">
                        <span className="font-medium">Tablet</span>: Test tournament management workflow
                      </label>
                    </div>
                    
                    <div className="flex items-start">
                      <input type="checkbox" id="test7" className="mt-1 mr-2" />
                      <label htmlFor="test7" className="text-sm">
                        <span className="font-medium">Desktop</span>: Test rating officer approval process
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-6">
                <div className="w-full">
                  <SyncStatusIndicator />
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CrossPlatformTesting;
