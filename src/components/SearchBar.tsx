// /src/components/SearchBar.tsx

import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Search, Sparkles, Clock, TrendingUp } from "lucide-react";

interface SearchBarProps {
  environment: string;
  release: string;
}

export function SearchBar({ environment, release }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const exampleQueries = [
    "Show me all critical vulnerabilities in the last 24 hours",
    "What's causing the spike in payment-gateway exceptions?",
    "Compare test coverage between v2.1.3 and v2.1.4",
    "Find services with declining performance metrics"
  ];

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    
    // Simulate AI analysis
    setTimeout(() => {
      const mockResults = [
        {
          type: "insight",
          title: "Critical Vulnerability Pattern Detected",
          description: "Analysis shows 3 new critical CVEs all related to Node.js dependencies. Recommend upgrading to Node 18.18.0+",
          confidence: 95,
          action: "Update dependencies"
        },
        {
          type: "correlation",
          title: "Exception Correlation Found",
          description: "Payment gateway exceptions spike correlates with database connection timeouts during peak hours (12-2 PM)",
          confidence: 88,
          action: "Scale database connections"
        },
        {
          type: "trend",
          title: "Coverage Improvement Trend",
          description: "Unit test coverage improved 2.3% since last release, but E2E coverage declined 1.1%",
          confidence: 92,
          action: "Focus on E2E tests"
        }
      ];
      
      setResults(mockResults);
      setIsSearching(false);
    }, 2000);
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "insight": return <Sparkles className="h-4 w-4 text-blue-500" />;
      case "correlation": return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "trend": return <Clock className="h-4 w-4 text-purple-500" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "insight": return "bg-blue-100 text-blue-800";
      case "correlation": return "bg-green-100 text-green-800";
      case "trend": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="border-t bg-card p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-blue-500" />
          <h3 className="font-semibold">AI-Powered Analysis</h3>
          <Badge variant="outline" className="text-xs">
            {environment} • {release}
          </Badge>
        </div>

        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <label htmlFor="ai-search-query" className="sr-only">
              Ask about vulnerabilities, exceptions, or coverage
            </label>
            <Input
              id="ai-search-query"
              placeholder="Ask anything about your vulnerabilities, exceptions, or coverage..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? "Analyzing..." : "Analyze"}
          </Button>
        </div>

        {!results.length && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Try these example queries:</p>
            <div className="flex flex-wrap gap-2">
              {exampleQueries.map((example, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleExampleClick(example)}
                  className="text-xs"
                >
                  {example}
                </Button>
              ))}
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">AI Analysis Results</h4>
            {results.map((result, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      {getTypeIcon(result.type)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium">{result.title}</h5>
                        <div className="flex items-center space-x-2">
                          <Badge className={getTypeColor(result.type)}>
                            {result.type}
                          </Badge>
                          <Badge variant="outline">
                            {result.confidence}% confidence
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{result.description}</p>
                      <Button size="sm" variant="outline">
                        {result.action}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}