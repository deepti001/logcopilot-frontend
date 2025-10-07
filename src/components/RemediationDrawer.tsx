import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import { ExternalLink, Copy, Sparkles, AlertTriangle, FileText, Plus } from "lucide-react";
import { VulnerabilityRecord } from "../types/vulnerability";
import { toast } from "sonner";

interface RemediationDrawerProps {
  vulnerability: VulnerabilityRecord;
  children: React.ReactNode;
}

export function RemediationDrawer({ vulnerability, children }: RemediationDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical": return "bg-red-100 text-red-800 border-red-200";
      case "high": return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard`);
  };

  const formatFirstSeenBuild = (vuln: VulnerabilityRecord): string => {
    if (!vuln.detectionHistory || vuln.detectionHistory.length === 0) {
      return "Unknown";
    }
    
    // Find the earliest detection
    const firstDetection = vuln.detectionHistory
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())[0];
    
    // Format as YYYY.MM.DD.build-sequence
    const date = firstDetection.timestamp;
    const buildNum = firstDetection.buildId.split('-').pop() || '1';
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}.${buildNum}`;
  };

  const formatFirstSeenTime = (vuln: VulnerabilityRecord): string => {
    if (!vuln.firstDetected) return "Unknown";
    
    // Format as DD MMM, HH:MM IST
    const date = vuln.firstDetected;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(date.getDate()).padStart(2, '0');
    const month = months[date.getMonth()];
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day} ${month}, ${hours}:${minutes}`;
  };

  // Mock remediation steps - in production these would come from AI analysis
  const remediationSteps = [
    {
      title: "Immediate Action",
      description: "Update the vulnerable component to the latest secure version",
      command: `docker build --build-arg NODE_VERSION=20-alpine .`,
      priority: "high"
    },
    {
      title: "Verification",
      description: "Scan the updated image to confirm the vulnerability is resolved",
      command: `docker scan your-image:latest`,
      priority: "medium"
    },
    {
      title: "Deployment",
      description: "Deploy the updated image to staging and production environments",
      command: `kubectl set image deployment/app app=your-image:latest`,
      priority: "medium"
    }
  ];

  const relatedLinks = [
    {
      title: "CVE Details",
      url: `https://cve.mitre.org/cgi-bin/cvename.cgi?name=${vulnerability.id}`,
      description: "Official CVE database entry"
    },
    {
      title: "Package Documentation",
      url: `https://www.npmjs.com/package/${vulnerability.component.split(':')[0]}`,
      description: "Package homepage and documentation"
    },
    {
      title: "Security Advisory",
      url: `https://github.com/advisories?query=${vulnerability.id}`,
      description: "GitHub security advisory"
    }
  ];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="w-[600px] sm:w-[800px] overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <SheetTitle className="text-xl font-semibold">
                {vulnerability.id}
              </SheetTitle>
              <div className="flex items-center gap-2">
                <Badge className={getSeverityColor(vulnerability.severity)}>
                  {vulnerability.severity}
                </Badge>
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">{vulnerability.component}</span>
              </div>
            </div>
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          </div>
          <SheetDescription className="text-left">
            AI-generated remediation guidance for this vulnerability. Always verify steps before applying in production.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Vulnerability Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Vulnerability Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="mt-1">{vulnerability.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">First Seen (Build)</label>
                  <p className="mt-1 font-mono text-sm">{formatFirstSeenBuild(vulnerability)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">First Seen (Time, IST)</label>
                  <p className="mt-1 font-mono text-sm">{formatFirstSeenTime(vulnerability)}</p>
                </div>
              </div>

              {vulnerability.layer && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Affected Layer</label>
                  <p className="mt-1 font-mono text-sm">{vulnerability.layer}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Remediation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-500" />
                AI-Generated Remediation
              </CardTitle>
              <CardDescription>
                Recommended steps to resolve this vulnerability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm">{vulnerability.aiRecommendation}</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2 h-7 px-2"
                  onClick={() => copyToClipboard(vulnerability.aiRecommendation, "Recommendation")}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
              </div>

              <div className="space-y-3">
                {remediationSteps.map((step, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{step.title}</h4>
                      <Badge variant={step.priority === "high" ? "destructive" : "secondary"} className="text-xs">
                        {step.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{step.description}</p>
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded font-mono text-sm flex items-center justify-between">
                      <code>{step.command}</code>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 px-2"
                        onClick={() => copyToClipboard(step.command, "Command")}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Related Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Related Links
              </CardTitle>
              <CardDescription>
                Additional resources and documentation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {relatedLinks.map((link, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div>
                      <h4 className="font-medium">{link.title}</h4>
                      <p className="text-sm text-muted-foreground">{link.description}</p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={link.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>
                Track and manage this vulnerability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button className="flex-1">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Jira Ticket
                </Button>
                <Button variant="outline" className="flex-1">
                  <FileText className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}