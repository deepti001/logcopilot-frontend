import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Header } from "./components/Header";
import { GlobalContextBar } from "./components/GlobalContextBar";
import { VulnerabilityDashboard } from "./components/VulnerabilityDashboard";
import { ExceptionsDashboard } from "./components/ExceptionsDashboard";
import { CoverageDashboard } from "./components/CoverageDashboard";
import { SearchBar } from "./components/SearchBar";
 
export default function App() {
  const [selectedEnvironment, setSelectedEnvironment] = useState("prod");
  const [selectedRelease, setSelectedRelease] = useState("v2.1.4");
  const [activeTab, setActiveTab] = useState("vulnerabilities");
  
  // Vulnerabilities state
  const [vulnTimePeriod, setVulnTimePeriod] = useState("last-build");
  const [vulnActiveFilters, setVulnActiveFilters] = useState<string[]>([]);
  
  // Exceptions state
  const [excTimeRange, setExcTimeRange] = useState<"hourly" | "daily">("hourly");
  const [excCluster, setExcCluster] = useState("all");
  const [excNamespace, setExcNamespace] = useState("all");
  const [excActiveFilters, setExcActiveFilters] = useState<string[]>([]);
 
  const handleVulnFilterRemove = (filter: string) => {
    setVulnActiveFilters(vulnActiveFilters.filter(f => f !== filter));
  };
 
  const handleExcFilterRemove = (filter: string) => {
    setExcActiveFilters(excActiveFilters.filter(f => f !== filter));
    
    // Reset corresponding state when filter is removed
    if (filter.startsWith("Cluster:")) {
      setExcCluster("all");
    } else if (filter.startsWith("Namespace:")) {
      setExcNamespace("all");
    }
  };
 
  const handleClusterChange = (value: string) => {
    setExcCluster(value);
    const clusterFilter = `Cluster: ${value}`;
    
    if (value !== "all" && !excActiveFilters.includes(clusterFilter)) {
      setExcActiveFilters([...excActiveFilters.filter(f => !f.startsWith("Cluster:")), clusterFilter]);
    } else if (value === "all") {
      setExcActiveFilters(excActiveFilters.filter(f => !f.startsWith("Cluster:")));
    }
  };
 
  const handleNamespaceChange = (value: string) => {
    setExcNamespace(value);
    const namespaceFilter = `Namespace: ${value}`;
    
    if (value !== "all" && !excActiveFilters.includes(namespaceFilter)) {
      setExcActiveFilters([...excActiveFilters.filter(f => !f.startsWith("Namespace:")), namespaceFilter]);
    } else if (value === "all") {
      setExcActiveFilters(excActiveFilters.filter(f => !f.startsWith("Namespace:")));
    }
  };
 
  const handleExportCsv = async () => {
    // Mock CSV export functionality
    const csvData = `"Timestamp","Type","Message","Service","Count"\n"2025-01-07 14:23:45","OutOfMemoryError","Java heap space exceeded","user-service","23"\n`;
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}-${selectedEnvironment}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };
 
  return (
    <div className="min-h-screen bg-background">
      <Header
        selectedEnvironment={selectedEnvironment}
        selectedRelease={selectedRelease}
        onEnvironmentChange={setSelectedEnvironment}
        onReleaseChange={setSelectedRelease}
      />
      
      <div className="grid grid-cols-12 gap-6 p-6">
        <div className="col-span-12">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
              <TabsTrigger value="exceptions">Exceptions</TabsTrigger>
              <TabsTrigger value="coverage">Coverage</TabsTrigger>
            </TabsList>
            
            {/* Global Context Bar */}
            <GlobalContextBar
              environment={selectedEnvironment}
              release={selectedRelease}
              activeTab={activeTab}
              timePeriod={activeTab === "vulnerabilities" ? vulnTimePeriod : undefined}
              onTimePeriodChange={activeTab === "vulnerabilities" ? setVulnTimePeriod : undefined}
              timeRange={activeTab === "exceptions" ? excTimeRange : undefined}
              onTimeRangeChange={activeTab === "exceptions" ? setExcTimeRange : undefined}
              cluster={activeTab === "exceptions" ? excCluster : undefined}
              onClusterChange={activeTab === "exceptions" ? handleClusterChange : undefined}
              namespace={activeTab === "exceptions" ? excNamespace : undefined}
              onNamespaceChange={activeTab === "exceptions" ? handleNamespaceChange : undefined}
              activeFilters={activeTab === "vulnerabilities" ? vulnActiveFilters : excActiveFilters}
              onRemoveFilter={activeTab === "vulnerabilities" ? handleVulnFilterRemove : handleExcFilterRemove}
              onExportCsv={handleExportCsv}
            />
            
            <TabsContent value="vulnerabilities" className="space-y-6">
              <VulnerabilityDashboard
                environment={selectedEnvironment}
                release={selectedRelease}
                timePeriod={vulnTimePeriod}
                activeFilters={vulnActiveFilters}
                onFiltersChange={setVulnActiveFilters}
              />
            </TabsContent>
            
            <TabsContent value="exceptions" className="space-y-6">
              <ExceptionsDashboard
                environment={selectedEnvironment}
                release={selectedRelease}
                timeRange={excTimeRange}
                cluster={excCluster}
                namespace={excNamespace}
                activeFilters={excActiveFilters}
                onFiltersChange={setExcActiveFilters}
              />
            </TabsContent>
            
            <TabsContent value="coverage" className="space-y-6">
              <CoverageDashboard
                environment={selectedEnvironment}
                release={selectedRelease}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <SearchBar
        environment={selectedEnvironment}
        release={selectedRelease}
      />
    </div>
  );
}
 