import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Header } from "./components/Header";
import { GlobalContextBar } from "./components/GlobalContextBar";
import { VulnerabilityDashboard } from "./components/VulnerabilityDashboard";
import { ExceptionsDashboard } from "./components/ExceptionsDashboard";
import { CoverageDashboard } from "./components/CoverageDashboard";
import { SearchBar } from "./components/SearchBar";
import { exportVulnerabilitiesToCSV } from "./utils/exportUtils";
import { enrichWithSuggestions } from "./utils/suggestions";

 
export default function App() {
  const [selectedEnvironment, setSelectedEnvironment] = useState("prod");
  const [selectedRelease, setSelectedRelease] = useState("v2.1.4");
  const [activeTab, setActiveTab] = useState("vulnerabilities");
  // rows to export (fed by VulnerabilityDashboard)
  const [exportRows, setExportRows] = useState<any[]>([]);
  
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
    if (activeTab !== "vulnerabilities") return;
    const enriched = await enrichWithSuggestions(exportRows, { concurrency: 4 });

    exportVulnerabilitiesToCSV(
      enriched,
      `vulnerabilities-${selectedEnvironment}-${new Date().toISOString().split("T")[0]}.csv`
    );
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
                onExportableRowsChange={setExportRows}
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
 