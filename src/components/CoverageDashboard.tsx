// /src/components/CoverageDashboard.tsx

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Target, TrendingUp, Code, TestTube } from "lucide-react";

interface CoverageDashboardProps {
  environment: string;
  release: string;
}

export function CoverageDashboard({ environment, release }: CoverageDashboardProps) {
  const coverageData = [
    { name: "Unit Tests", current: 87.5, target: 90, previous: 85.2 },
    { name: "Integration Tests", current: 72.3, target: 80, previous: 70.1 },
    { name: "E2E Tests", current: 65.8, target: 70, previous: 63.5 },
    { name: "Security Scans", current: 98.2, target: 95, previous: 97.8 }
  ];

  const trendData = [
    { date: "Sep 27", unit: 85.2, integration: 70.1, e2e: 63.5, security: 97.8 },
    { date: "Sep 30", unit: 86.1, integration: 71.2, e2e: 64.2, security: 98.0 },
    { date: "Oct 02", unit: 87.0, integration: 71.8, e2e: 65.1, security: 98.1 },
    { date: "Oct 04", unit: 87.5, integration: 72.3, e2e: 65.8, security: 98.2 }
  ];

  const servicesCoverage = [
    {
      service: "user-service",
      unit: 92.1,
      integration: 78.5,
      e2e: 68.9,
      overall: 79.8,
      status: "Good"
    },
    {
      service: "payment-gateway",
      unit: 95.3,
      integration: 85.2,
      e2e: 75.6,
      overall: 85.4,
      status: "Excellent"
    },
    {
      service: "notification-service",
      unit: 82.7,
      integration: 65.4,
      e2e: 58.2,
      overall: 68.8,
      status: "Needs Improvement"
    },
    {
      service: "auth-service",
      unit: 88.9,
      integration: 74.1,
      e2e: 62.3,
      overall: 75.1,
      status: "Good"
    },
    {
      service: "order-service",
      unit: 76.5,
      integration: 58.9,
      e2e: 52.1,
      overall: 62.5,
      status: "Needs Improvement"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "excellent": return "bg-green-100 text-green-800";
      case "good": return "bg-blue-100 text-blue-800";
      case "needs improvement": return "bg-yellow-100 text-yellow-800";
      case "poor": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getCoverageColor = (coverage: number) => {
    if (coverage >= 90) return "text-green-600";
    if (coverage >= 80) return "text-blue-600";
    if (coverage >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const overallCoverage = servicesCoverage.reduce((sum, service) => sum + service.overall, 0) / servicesCoverage.length;
  const testsPassing = 1247;
  const testsFailing = 23;
  const testsTotal = testsPassing + testsFailing;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Coverage</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallCoverage.toFixed(1)}%</div>
            <Progress value={overallCoverage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tests Passing</CardTitle>
            <TestTube className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{testsPassing}</div>
            <p className="text-xs text-muted-foreground">
              {((testsPassing / testsTotal) * 100).toFixed(1)}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tests Failing</CardTitle>
            <TestTube className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{testsFailing}</div>
            <p className="text-xs text-muted-foreground">
              {((testsFailing / testsTotal) * 100).toFixed(1)}% failure rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Code Quality</CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">A</div>
            <p className="text-xs text-green-600">
              +0.2 improvement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Coverage Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Coverage Metrics</CardTitle>
          <CardDescription>Current coverage levels vs targets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {coverageData.map((metric) => (
              <div key={metric.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{metric.name}</span>
                  <div className="flex items-center space-x-2">
                    <span className={`font-bold ${getCoverageColor(metric.current)}`}>
                      {metric.current}%
                    </span>
                    <span className="text-sm text-muted-foreground">
                      (Target: {metric.target}%)
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Progress value={metric.current} className="flex-1" />
                  <TrendingUp className={`h-4 w-4 ${metric.current > metric.previous ? 'text-green-500' : 'text-red-500'}`} />
                  <span className={`text-xs ${metric.current > metric.previous ? 'text-green-600' : 'text-red-600'}`}>
                    {metric.current > metric.previous ? '+' : ''}{(metric.current - metric.previous).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Coverage Trends</CardTitle>
            <CardDescription>Coverage trends over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[50, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, ""]} />
                <Line type="monotone" dataKey="unit" stroke="#3b82f6" strokeWidth={2} name="Unit Tests" />
                <Line type="monotone" dataKey="integration" stroke="#10b981" strokeWidth={2} name="Integration" />
                <Line type="monotone" dataKey="e2e" stroke="#f59e0b" strokeWidth={2} name="E2E Tests" />
                <Line type="monotone" dataKey="security" stroke="#8b5cf6" strokeWidth={2} name="Security" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Coverage by Type</CardTitle>
            <CardDescription>Current coverage distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={coverageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, "Coverage"]} />
                <Bar dataKey="current" fill="#3b82f6" />
                <Bar dataKey="target" fill="#e5e7eb" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Services Coverage Table */}
      <Card>
        <CardHeader>
          <CardTitle>Service Coverage Breakdown</CardTitle>
          <CardDescription>Coverage metrics for each service</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Unit Tests</TableHead>
                <TableHead>Integration</TableHead>
                <TableHead>E2E Tests</TableHead>
                <TableHead>Overall</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servicesCoverage.map((service) => (
                <TableRow key={service.service}>
                  <TableCell className="font-medium">{service.service}</TableCell>
                  <TableCell className={getCoverageColor(service.unit)}>
                    {service.unit}%
                  </TableCell>
                  <TableCell className={getCoverageColor(service.integration)}>
                    {service.integration}%
                  </TableCell>
                  <TableCell className={getCoverageColor(service.e2e)}>
                    {service.e2e}%
                  </TableCell>
                  <TableCell className={getCoverageColor(service.overall)}>
                    <strong>{service.overall}%</strong>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(service.status)}>
                      {service.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}