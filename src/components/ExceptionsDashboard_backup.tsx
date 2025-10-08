import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { BadgeSeverity } from "./ui/badge-severity";
import { CardKPI } from "./ui/card-kpi";
import { ButtonIconOnly } from "./ui/button-icon-only";
import { EmptyState } from "./ui/empty-state";
import { ErrorState } from "./ui/error-state";
import { LoadingState } from "./ui/loading-state";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Skeleton } from "./ui/skeleton";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  Server, 
  Database, 
  RefreshCw,
  Eye,
  ExternalLink,
  Clock,
  Activity,
  Zap,
  AlertTriangle,
  Users,
  X,
  ChevronDown,
  RotateCcw,
  Brain
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ExceptionsDashboardProps {
  environment: string;
  release: string;
  timeRange?: "hourly" | "daily";
  cluster?: string;
  namespace?: string;
  activeFilters?: string[];
  onFiltersChange?: (filters: string[]) => void;
}

interface Exception {
  id: string;
  timestamp: string;
  type: string;
  message: string;
  servicePod: string;
  clusterNS: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  stackTrace: string;
  k8sEvent: string;
}

interface KPI {
  label: string;
  value: number;
  delta: number;
  deltaType: "increase" | "decrease";
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export function ExceptionsDashboard({ 
  environment, 
  release,
  timeRange = "hourly",
  cluster = "all",
  namespace = "all",
  activeFilters = [],
  onFiltersChange
}: ExceptionsDashboardProps) {
  const [groupBy, setGroupBy] = useState<"exception-type" | "service-pod">("exception-type");
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Exception | null>(null);
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Enhanced mock data with multiple clusters
  const allExceptions: Exception[] = [
    // Production Cluster Exceptions
    {
      id: "EXC-001",
      timestamp: "2025-01-07 14:23:45 IST",
      type: "OutOfMemoryError",
      message: "Java heap space exceeded in user authentication module",
      servicePod: "user-service-7d8f9c-abc123",
      clusterNS: "prod-cluster/auth-ns",
      count: 23,
      firstSeen: "2025-01-07 12:15:30 IST",
      lastSeen: "2025-01-07 14:23:45 IST",
      severity: "Critical",
      stackTrace: "java.lang.OutOfMemoryError: Java heap space\\n\\tat com.example.UserService.authenticate(UserService.java:45)\\n\\tat com.example.AuthController.login(AuthController.java:23)",
      k8sEvent: "Pod user-service-7d8f9c-abc123 in namespace auth-ns was killed due to OOMKilled"
    },
    {
      id: "EXC-002",
      timestamp: "2025-01-07 14:20:12 IST",
      type: "NullPointerException",
      message: "Null reference in payment processing workflow",
      servicePod: "payment-service-5f6g7h-def456",
      clusterNS: "prod-cluster/payments-ns",
      count: 15,
      firstSeen: "2025-01-07 13:45:22 IST",
      lastSeen: "2025-01-07 14:20:12 IST",
      severity: "High",
      stackTrace: "java.lang.NullPointerException\\n\\tat com.example.PaymentService.processPayment(PaymentService.java:67)\\n\\tat com.example.OrderController.checkout(OrderController.java:89)",
      k8sEvent: "Container payment-service restarted 3 times in the last 10 minutes"
    },
    {
      id: "EXC-003",
      timestamp: "2025-01-07 14:18:33 IST",
      type: "ConnectionTimeout",
      message: "Database connection timeout in order management system",
      servicePod: "order-service-8h9i0j-ghi789",
      clusterNS: "prod-cluster/orders-ns",
      count: 42,
      firstSeen: "2025-01-07 11:30:15 IST",
      lastSeen: "2025-01-07 14:18:33 IST",
      severity: "Medium",
      stackTrace: "java.sql.SQLException: Connection timeout\\n\\tat com.example.DatabaseConnection.connect(DatabaseConnection.java:34)\\n\\tat com.example.OrderService.createOrder(OrderService.java:78)",
      k8sEvent: "Service order-service experiencing high latency and connection issues"
    },
    {
      id: "EXC-004",
      timestamp: "2025-01-07 14:15:28 IST",
      type: "RateLimitExceeded",
      message: "API rate limit exceeded for notification service",
      servicePod: "notification-service-1k2l3m-jkl012",
      clusterNS: "prod-cluster/notifications-ns",
      count: 8,
      firstSeen: "2025-01-07 14:10:12 IST",
      lastSeen: "2025-01-07 14:15:28 IST",
      severity: "Low",
      stackTrace: "com.example.RateLimitException: Rate limit of 1000 requests per minute exceeded\\n\\tat com.example.NotificationService.sendNotification(NotificationService.java:45)",
      k8sEvent: "Pod notification-service-1k2l3m-jkl012 scaled up due to increased load"
    },
    
    // Staging Cluster Exceptions
    {
      id: "EXC-005",
      timestamp: "2025-01-07 14:22:18 IST",
      type: "OutOfMemoryError",
      message: "Memory leak in staging user service during load testing",
      servicePod: "user-service-stg-2n3o4p-xyz567",
      clusterNS: "staging-cluster/user-ns",
      count: 12,
      firstSeen: "2025-01-07 13:30:45 IST",
      lastSeen: "2025-01-07 14:22:18 IST",
      severity: "High",
      stackTrace: "java.lang.OutOfMemoryError: Metaspace\\n\\tat com.staging.UserService.loadTest(UserService.java:123)\\n\\tat com.staging.LoadTestController.execute(LoadTestController.java:45)",
      k8sEvent: "Pod user-service-stg-2n3o4p-xyz567 in staging-cluster exceeded memory limits"
    },
    {
      id: "EXC-006",
      timestamp: "2025-01-07 14:19:55 IST",
      type: "ConnectionTimeout",
      message: "Redis connection timeout in staging cache layer",
      servicePod: "cache-service-stg-5q6r7s-abc890",
      clusterNS: "staging-cluster/cache-ns",
      count: 7,
      firstSeen: "2025-01-07 14:15:12 IST",
      lastSeen: "2025-01-07 14:19:55 IST",
      severity: "Medium",
      stackTrace: "redis.clients.jedis.exceptions.JedisConnectionException: Connection timeout\\n\\tat com.staging.CacheService.get(CacheService.java:67)",
      k8sEvent: "Service cache-service in staging-cluster experiencing connection issues"
    },
    {
      id: "EXC-007",
      timestamp: "2025-01-07 14:17:30 IST",
      type: "ClassNotFoundException",
      message: "Missing dependency in staging deployment",
      servicePod: "api-service-stg-8t9u0v-def123",
      clusterNS: "staging-cluster/api-ns",
      count: 3,
      firstSeen: "2025-01-07 14:16:45 IST",
      lastSeen: "2025-01-07 14:17:30 IST",
      severity: "Critical",
      stackTrace: "java.lang.ClassNotFoundException: com.staging.MissingClass\\n\\tat java.lang.ClassLoader.loadClass(ClassLoader.java:424)",
      k8sEvent: "Pod api-service-stg-8t9u0v-def123 failing to start due to missing dependencies"
    },

    // Dev Cluster Exceptions
    {
      id: "EXC-008",
      timestamp: "2025-01-07 14:21:03 IST",
      type: "NullPointerException",
      message: "Development feature branch causing null pointer issues",
      servicePod: "feature-service-dev-1w2x3y-ghi456",
      clusterNS: "dev-cluster/features-ns",
      count: 18,
      firstSeen: "2025-01-07 13:45:20 IST",
      lastSeen: "2025-01-07 14:21:03 IST",
      severity: "High",
      stackTrace: "java.lang.NullPointerException\\n\\tat com.dev.FeatureService.processRequest(FeatureService.java:89)\\n\\tat com.dev.DevController.handle(DevController.java:34)",
      k8sEvent: "Container feature-service-dev restarted 5 times due to NPE"
    },
    {
      id: "EXC-009",
      timestamp: "2025-01-07 14:16:42 IST",
      type: "IllegalArgumentException",
      message: "Invalid configuration in development environment",
      servicePod: "config-service-dev-4z5a6b-jkl789",
      clusterNS: "dev-cluster/config-ns",
      count: 6,
      firstSeen: "2025-01-07 14:10:30 IST",
      lastSeen: "2025-01-07 14:16:42 IST",
      severity: "Medium",
      stackTrace: "java.lang.IllegalArgumentException: Invalid config value\\n\\tat com.dev.ConfigService.validate(ConfigService.java:156)",
      k8sEvent: "ConfigMap changes in dev-cluster causing service disruption"
    },

    // Test Cluster Exceptions  
    {
      id: "EXC-010",
      timestamp: "2025-01-07 14:14:27 IST",
      type: "AssertionError",
      message: "Test assertion failure in automated testing suite",
      servicePod: "test-runner-7c8d9e-mno012",
      clusterNS: "test-cluster/testing-ns",
      count: 24,
      firstSeen: "2025-01-07 12:00:15 IST",
      lastSeen: "2025-01-07 14:14:27 IST",
      severity: "Low",
      stackTrace: "java.lang.AssertionError: Expected 200 but was 404\\n\\tat com.test.ApiTestSuite.testEndpoint(ApiTestSuite.java:78)",
      k8sEvent: "Test suite in test-cluster completed with failures"
    },
    {
      id: "EXC-011",
      timestamp: "2025-01-07 14:12:15 IST",
      type: "TimeoutException",
      message: "Test execution timeout in performance testing",
      servicePod: "perf-test-0f1g2h-pqr345",
      clusterNS: "test-cluster/perf-ns",
      count: 2,
      firstSeen: "2025-01-07 14:05:30 IST",
      lastSeen: "2025-01-07 14:12:15 IST",
      severity: "Medium",
      stackTrace: "java.util.concurrent.TimeoutException: Test execution exceeded 30 seconds\\n\\tat com.test.PerfTestRunner.execute(PerfTestRunner.java:145)",
      k8sEvent: "Performance test pods in test-cluster scaled down due to timeout"
    }
  ];

  // Filter exceptions based on cluster, namespace, and time range selection
  const exceptions = React.useMemo(() => {
    let filtered = allExceptions;
    
    // Filter by time range first - simulate time-based filtering
    if (timeRange === "hourly") {
      // For hourly view, show fewer exceptions to simulate recent timeframe
      filtered = filtered.slice(0, Math.ceil(filtered.length * 0.7));
    } else {
      // For daily view, show more exceptions to simulate longer timeframe
      filtered = [...filtered];
    }
    
    // Filter by cluster
    if (cluster !== "all") {
      filtered = filtered.filter(exception => 
        exception.clusterNS.startsWith(`${cluster}/`) || 
        exception.clusterNS.startsWith(`${cluster}-cluster/`)
      );
    }
    
    // Then filter by namespace if selected
    if (namespace !== "all") {
      filtered = filtered.filter(exception => {
        // Extract namespace from clusterNS (format: "cluster-name/namespace")
        const namespacePart = exception.clusterNS.split('/')[1];
        return namespacePart === namespace;
      });
    }
    
    return filtered;
  }, [cluster, namespace, timeRange]);

  // Calculate KPIs based on filtered exceptions
  const kpis: KPI[] = React.useMemo(() => {
    const totalExceptions = exceptions.reduce((sum, exc) => sum + exc.count, 0);
    const crashLoopCount = exceptions.filter(exc => exc.k8sEvent.includes("restarted")).reduce((sum, exc) => sum + exc.count, 0);
    const oomCount = exceptions.filter(exc => exc.type === "OutOfMemoryError").reduce((sum, exc) => sum + exc.count, 0);
    const timeoutCount = exceptions.filter(exc => exc.type.includes("Timeout")).reduce((sum, exc) => sum + exc.count, 0);
    const uniquePods = new Set(exceptions.map(exc => exc.servicePod.split("-")[0])).size;

    // Adjust delta values based on time range (daily has larger deltas)
    const timeMultiplier = timeRange === "daily" ? 2.5 : 1;
    
    return [
      {
        label: "Total Exceptions",
        value: totalExceptions,
        delta: Math.round((cluster === "all" ? -156 : cluster === "staging-cluster" ? -8 : cluster === "dev-cluster" ? 12 : -3) * timeMultiplier),
        deltaType: cluster === "dev-cluster" ? "increase" : "decrease",
        icon: AlertCircle,
        color: "text-blue-600"
      },
      {
        label: "CrashLoopBackOff",
        value: crashLoopCount,
        delta: Math.round((cluster === "all" ? 8 : cluster === "staging-cluster" ? 2 : cluster === "dev-cluster" ? 5 : 0) * timeMultiplier),
        deltaType: "increase",
        icon: RefreshCw,
        color: "text-red-600"
      },
      {
        label: "OOMKilled",
        value: oomCount,
        delta: Math.round((cluster === "all" ? -3 : cluster === "staging-cluster" ? 1 : 0) * timeMultiplier),
        deltaType: cluster === "staging-cluster" ? "increase" : "decrease",
        icon: Database,
        color: "text-orange-600"
      },
      {
        label: "Timeouts",
        value: timeoutCount,
        delta: Math.round((cluster === "all" ? 15 : cluster === "staging-cluster" ? 3 : cluster === "test-cluster" ? 1 : 2) * timeMultiplier),
        deltaType: "increase",
        icon: AlertTriangle,
        color: "text-yellow-600"
      },
      {
        label: "Unique Services",
        value: uniquePods,
        delta: Math.round((cluster === "all" ? -2 : cluster === "staging-cluster" ? -1 : cluster === "dev-cluster" ? 1 : 0) * timeMultiplier),
        deltaType: cluster === "dev-cluster" ? "increase" : "decrease",
        icon: Users,
        color: "text-green-600"
      }
    ];
  }, [exceptions, cluster, timeRange]);

  // Generate chart data based on timeRange, cluster filter, and groupBy selection
  const chartData = React.useMemo(() => {
    const getClusterMultiplier = () => {
      switch (cluster) {
        case "staging-cluster": return 0.4; // Staging has less traffic
        case "dev-cluster": return 0.2; // Dev has minimal traffic
        case "test-cluster": return 0.1; // Test has very low traffic
        default: return 1; // "all" or "prod-cluster" uses full data
      }
    };

    const multiplier = getClusterMultiplier();

    if (groupBy === "exception-type") {
      // Group by exception type
      if (timeRange === "hourly") {
        // Hourly data points (24 hours) - adjusted for cluster
        const baseData = [
          { time: "00:00", "OutOfMemoryError": 15, "NullPointerException": 8, "ConnectionTimeout": 12, "RateLimitExceeded": 5 },
          { time: "02:00", "OutOfMemoryError": 12, "NullPointerException": 10, "ConnectionTimeout": 8, "RateLimitExceeded": 7 },
          { time: "04:00", "OutOfMemoryError": 18, "NullPointerException": 15, "ConnectionTimeout": 20, "RateLimitExceeded": 12 },
          { time: "06:00", "OutOfMemoryError": 22, "NullPointerException": 18, "ConnectionTimeout": 15, "RateLimitExceeded": 8 },
          { time: "08:00", "OutOfMemoryError": 45, "NullPointerException": 32, "ConnectionTimeout": 28, "RateLimitExceeded": 22 },
          { time: "10:00", "OutOfMemoryError": 38, "NullPointerException": 28, "ConnectionTimeout": 25, "RateLimitExceeded": 18 },
          { time: "12:00", "OutOfMemoryError": 52, "NullPointerException": 35, "ConnectionTimeout": 32, "RateLimitExceeded": 25 },
          { time: "14:00", "OutOfMemoryError": 28, "NullPointerException": 18, "ConnectionTimeout": 22, "RateLimitExceeded": 15 },
          { time: "16:00", "OutOfMemoryError": 32, "NullPointerException": 22, "ConnectionTimeout": 18, "RateLimitExceeded": 12 },
          { time: "18:00", "OutOfMemoryError": 25, "NullPointerException": 18, "ConnectionTimeout": 15, "RateLimitExceeded": 10 },
          { time: "20:00", "OutOfMemoryError": 22, "NullPointerException": 15, "ConnectionTimeout": 12, "RateLimitExceeded": 8 },
          { time: "22:00", "OutOfMemoryError": 18, "NullPointerException": 12, "ConnectionTimeout": 10, "RateLimitExceeded": 6 }
        ];
        
        return baseData.map(item => ({
          ...item,
          "OutOfMemoryError": Math.round(item.OutOfMemoryError * multiplier),
          "NullPointerException": Math.round(item.NullPointerException * multiplier),
          "ConnectionTimeout": Math.round(item.ConnectionTimeout * multiplier),
          "RateLimitExceeded": Math.round(item.RateLimitExceeded * multiplier)
        }));
      } else {
        // Daily data points (7 days) - adjusted for cluster  
        const baseData = [
          { time: "Mon", "OutOfMemoryError": 245, "NullPointerException": 178, "ConnectionTimeout": 156, "RateLimitExceeded": 98 },
          { time: "Tue", "OutOfMemoryError": 312, "NullPointerException": 203, "ConnectionTimeout": 189, "RateLimitExceeded": 112 },
          { time: "Wed", "OutOfMemoryError": 398, "NullPointerException": 267, "ConnectionTimeout": 234, "RateLimitExceeded": 145 },
          { time: "Thu", "OutOfMemoryError": 423, "NullPointerException": 289, "ConnectionTimeout": 198, "RateLimitExceeded": 167 },
          { time: "Fri", "OutOfMemoryError": 567, "NullPointerException": 334, "ConnectionTimeout": 278, "RateLimitExceeded": 203 },
          { time: "Sat", "OutOfMemoryError": 298, "NullPointerException": 198, "ConnectionTimeout": 156, "RateLimitExceeded": 89 },
          { time: "Sun", "OutOfMemoryError": 234, "NullPointerException": 167, "ConnectionTimeout": 134, "RateLimitExceeded": 76 }
        ];
        
        return baseData.map(item => ({
          ...item,
          "OutOfMemoryError": Math.round(item.OutOfMemoryError * multiplier),
          "NullPointerException": Math.round(item.NullPointerException * multiplier),
          "ConnectionTimeout": Math.round(item.ConnectionTimeout * multiplier),
          "RateLimitExceeded": Math.round(item.RateLimitExceeded * multiplier)
        }));
      }
    } else {
      // Group by service/pod
      if (timeRange === "hourly") {
        // Hourly data points (24 hours) - grouped by services
        const baseData = [
          { time: "00:00", "user-service": 20, "auth-service": 12, "payment-service": 8, "order-service": 15 },
          { time: "02:00", "user-service": 17, "auth-service": 15, "payment-service": 10, "order-service": 12 },
          { time: "04:00", "user-service": 25, "auth-service": 20, "payment-service": 15, "order-service": 18 },
          { time: "06:00", "user-service": 30, "auth-service": 18, "payment-service": 12, "order-service": 22 },
          { time: "08:00", "user-service": 55, "auth-service": 38, "payment-service": 28, "order-service": 45 },
          { time: "10:00", "user-service": 48, "auth-service": 32, "payment-service": 25, "order-service": 38 },
          { time: "12:00", "user-service": 65, "auth-service": 42, "payment-service": 35, "order-service": 52 },
          { time: "14:00", "user-service": 35, "auth-service": 25, "payment-service": 18, "order-service": 28 },
          { time: "16:00", "user-service": 40, "auth-service": 28, "payment-service": 22, "order-service": 32 },
          { time: "18:00", "user-service": 32, "auth-service": 22, "payment-service": 18, "order-service": 25 },
          { time: "20:00", "user-service": 28, "auth-service": 18, "payment-service": 15, "order-service": 22 },
          { time: "22:00", "user-service": 22, "auth-service": 15, "payment-service": 12, "order-service": 18 }
        ];
        
        return baseData.map(item => ({
          ...item,
          "user-service": Math.round(item["user-service"] * multiplier),
          "auth-service": Math.round(item["auth-service"] * multiplier),
          "payment-service": Math.round(item["payment-service"] * multiplier),
          "order-service": Math.round(item["order-service"] * multiplier)
        }));
      } else {
        // Daily data points (7 days) - grouped by services
        const baseData = [
          { time: "Mon", "user-service": 320, "auth-service": 198, "payment-service": 156, "order-service": 245 },
          { time: "Tue", "user-service": 398, "auth-service": 245, "payment-service": 189, "order-service": 312 },
          { time: "Wed", "user-service": 478, "auth-service": 312, "payment-service": 234, "order-service": 398 },
          { time: "Thu", "user-service": 523, "auth-service": 334, "payment-service": 198, "order-service": 423 },
          { time: "Fri", "user-service": 678, "auth-service": 445, "payment-service": 278, "order-service": 567 },
          { time: "Sat", "user-service": 378, "auth-service": 234, "payment-service": 156, "order-service": 298 },
          { time: "Sun", "user-service": 298, "auth-service": 189, "payment-service": 134, "order-service": 234 }
        ];
        
        return baseData.map(item => ({
          ...item,
          "user-service": Math.round(item["user-service"] * multiplier),
          "auth-service": Math.round(item["auth-service"] * multiplier),
          "payment-service": Math.round(item["payment-service"] * multiplier),
          "order-service": Math.round(item["order-service"] * multiplier)
        }));
      }
    }
  }, [timeRange, cluster, groupBy]);

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatTimePeriod = (period: string) => {
    switch (period) {
      case "1-hour": return "Last Hour";
      case "1-day": return "Last 24 Hours";
      case "1-week": return "Last Week";
      case "1-month": return "Last Month";
      default: return "Last 24 Hours";
    }
  };

  const generateAIRecommendation = async (exception: Exception) => {
    setIsGeneratingAI(true);
    setAiRecommendation(null);
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const recommendations = {
      "OutOfMemoryError": `**Memory Management Recommendations:**

1. **Immediate Actions:**
   - Increase JVM heap size from current setting to at least 4GB
   - Add -XX:+HeapDumpOnOutOfMemoryError flag for debugging
   - Implement memory monitoring alerts

2. **Code Optimization:**
   - Review authentication module for memory leaks
   - Implement connection pooling for database connections
   - Add pagination to reduce data loading

3. **Infrastructure:**
   - Consider horizontal scaling for user service pods
   - Set up memory limits and requests in Kubernetes
   - Enable garbage collection monitoring`,

      "NullPointerException": `**Null Pointer Prevention:**

1. **Code Quality:**
   - Implement null safety checks using Optional<T>
   - Add defensive programming practices
   - Use null object pattern where appropriate

2. **Testing:**
   - Increase unit test coverage for edge cases
   - Add integration tests for payment workflows
   - Implement contract testing

3. **Monitoring:**
   - Add detailed logging around payment processing
   - Implement circuit breaker pattern
   - Set up real-time alerting for payment failures`,

      "ConnectionTimeout": `**Connection Timeout Resolution:**

1. **Database Optimization:**
   - Increase connection pool size (current: 10, recommended: 25)
   - Optimize slow queries in order management
   - Implement read replicas for reporting queries

2. **Network Configuration:**
   - Increase connection timeout from 5s to 15s
   - Configure TCP keep-alive settings
   - Implement retry mechanism with exponential backoff

3. **Monitoring:**
   - Set up database performance monitoring
   - Track connection pool utilization
   - Monitor network latency between services`
    };

    const recommendation = recommendations[exception.type as keyof typeof recommendations] || 
      `**General Exception Handling:**

1. **Immediate Investigation:**
   - Review service logs around timestamp ${exception.timestamp}
   - Check related services and dependencies
   - Verify configuration changes

2. **Prevention:**
   - Implement comprehensive error handling
   - Add monitoring and alerting
   - Consider circuit breaker patterns

3. **Recovery:**
   - Implement graceful degradation
   - Add retry mechanisms
   - Consider rollback procedures`;

    setAiRecommendation(recommendation);
    setIsGeneratingAI(false);
  };

  const ExceptionDetailDrawer = ({ exception }: { exception: Exception }) => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Eye className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[600px] max-w-[90vw]">
        <SheetHeader>
          <SheetTitle>Exception Details</SheetTitle>
          <SheetDescription>
            {exception.type} - {exception.id}
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Service/Pod</Label>
              <p className="text-sm text-muted-foreground font-mono">{exception.servicePod}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Cluster/Namespace</Label>
              <p className="text-sm text-muted-foreground">{exception.clusterNS}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">First Seen</Label>
              <p className="text-sm text-muted-foreground">{exception.firstSeen}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Last Seen</Label>
              <p className="text-sm text-muted-foreground">{exception.lastSeen}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Count</Label>
              <p className="text-sm font-bold">{exception.count}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Severity</Label>
              <BadgeSeverity severity={exception.severity} />
            </div>
          </div>
          
          <Separator />
          
          <div>
            <Label className="text-sm font-medium">Exception Message</Label>
            <p className="text-sm text-muted-foreground mt-1">{exception.message}</p>
          </div>
          
          <div>
            <Label className="text-sm font-medium">Stack Trace</Label>
            <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto whitespace-pre-wrap">
              {exception.stackTrace}
            </pre>
          </div>
          
          <div>
            <Label className="text-sm font-medium">Kubernetes Event</Label>
            <p className="text-sm text-muted-foreground mt-1">{exception.k8sEvent}</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  const AIRemediationDrawer = ({ exception }: { exception: Exception }) => (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2"
          onClick={() => generateAIRecommendation(exception)}
        >
          <Brain className="h-4 w-4" />
          Generate
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[600px] max-w-[90vw]">
        <SheetHeader>
          <SheetTitle>AI Remediation Recommendations</SheetTitle>
          <SheetDescription>
            {exception.type} in {exception.servicePod}
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6">
          {isGeneratingAI ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Analyzing exception and generating recommendations...
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ) : aiRecommendation ? (
            <div className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-line text-sm">{aiRecommendation}</div>
              </div>
              
              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => generateAIRecommendation(exception)}
                  disabled={isGeneratingAI}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Regenerate
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Click regenerate to get AI recommendations</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );

  if (hasError) {
    return (
      <ErrorState
        title="Failed to load exceptions data"
        description="There was an error loading the runtime exceptions"
        onRetry={() => setHasError(false)}
        retryLabel="Try Again"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-5"
      >
        {kpis.map((kpi, index) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <CardKPI
              title={kpi.label}
              value={kpi.value}
              delta={kpi.delta}
              deltaType={kpi.deltaType}
              icon={kpi.icon}
              iconColor={kpi.color}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Exception Trends Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Exception Trends</CardTitle>
                <CardDescription>
                  Exception frequency over time grouped by {groupBy === "exception-type" ? "type" : "service/pod"}
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Group by:</Label>
                  <Select value={groupBy} onValueChange={setGroupBy}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exception-type">Exception Type</SelectItem>
                      <SelectItem value="service-pod">Service/Pod</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[400px] flex items-center justify-center">
                <div className="space-y-4 w-full">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => value}
                  />
                  <YAxis />
                  <RechartsTooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">{label}</p>
                            {payload.map((entry, index) => (
                              <p key={index} className="text-sm" style={{ color: entry.color }}>
                                {entry.dataKey}: {entry.value}
                              </p>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="OutOfMemoryError" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="NullPointerException" stackId="1" stroke="#f97316" fill="#f97316" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="ConnectionTimeout" stackId="1" stroke="#eab308" fill="#eab308" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="RateLimitExceeded" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Exceptions Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Runtime Exceptions</CardTitle>
                <CardDescription>Detailed exception logs and events</CardDescription>
              </div>
              <div className="text-sm text-muted-foreground">
                Showing {exceptions.length} of {allExceptions.length} exceptions
                <span className="ml-2 text-green-600">
                  ({timeRange === "hourly" ? "last 24 hours" : "last 7 days"})
                </span>
                {(cluster !== "all" || namespace !== "all") && (
                  <span className="ml-2 text-blue-600">
                    • filtered by{' '}
                    {cluster !== "all" && `${cluster}-cluster`}
                    {cluster !== "all" && namespace !== "all" && ", "}
                    {namespace !== "all" && `${namespace}-ns`}
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingState variant="table" />
            ) : exceptions.length === 0 ? (
              <EmptyState variant="exceptions" />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time (IST)</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Service/Pod</TableHead>
                      <TableHead>Cluster/NS</TableHead>
                      <TableHead>Count</TableHead>
                      <TableHead>First Seen</TableHead>
                      <TableHead>Last Seen</TableHead>
                      <TableHead>Actions</TableHead>
                      <TableHead>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">Remediation (AI)</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Generated from build/runtime context. Verify before applying.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exceptions.map((exception) => (
                      <TableRow key={exception.id}>
                        <TableCell className="font-mono text-xs">{exception.timestamp}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {exception.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate" title={exception.message}>
                            {exception.message}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{exception.servicePod}</TableCell>
                        <TableCell className="text-xs">{exception.clusterNS}</TableCell>
                        <TableCell className="font-bold">{exception.count}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{exception.firstSeen}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{exception.lastSeen}</TableCell>
                        <TableCell>
                          <ExceptionDetailDrawer exception={exception} />
                        </TableCell>
                        <TableCell>
                          <AIRemediationDrawer exception={exception} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}