
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tournament, Player } from "@/lib/mockData";

interface GenerateReportDialogProps {
  tournament: Tournament;
  players: Player[];
}

const GenerateReportDialog: React.FC<GenerateReportDialogProps> = ({ 
  tournament, 
  players 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create a simple text report
      const reportContent = `
Tournament Report: ${tournament.name}
Date: ${tournament.start_date} - ${tournament.end_date}
Location: ${tournament.location}, ${tournament.state}
Total Players: ${players.length}
Rounds: ${tournament.rounds}

Players:
${players.map((player, index) => `${index + 1}. ${player.name} (Rating: ${player.rating})`).join('\n')}
      `.trim();

      // Create and download the report
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${tournament.name.replace(/\s+/g, '_')}_report.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Report Generated",
        description: "Tournament report has been downloaded successfully.",
      });
      
      setIsOpen(false);
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Tournament Report</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>Generate a comprehensive report for this tournament including:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Tournament details and standings</li>
              <li>Player roster and ratings</li>
              <li>Round results and pairings</li>
              <li>Rating changes for each player</li>
            </ul>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={generateReport} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate & Download
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateReportDialog;
