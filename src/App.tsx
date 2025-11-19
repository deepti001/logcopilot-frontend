// src/App.tsx
import { useState, useEffect } from "react";
import { getEnvironments, getLogGroups } from "./services/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Header } from "./components/Header";
import { GlobalContextBar } from "./components/GlobalContextBar";
import { VulnerabilityDashboard } from "./components/VulnerabilityDashboard";
import { ExceptionsDashboard } from "./components/ExceptionsDashboard";
import { CoverageDashboard } from "./components/CoverageDashboard";
import { SearchBar } from "./components/SearchBar";
import { exportVulnerabilitiesToCSV } from "./utils/exportUtils";
import { enrichWithSuggestions, suggestionKey } from "./utils/suggestions";

 
export default function App() {
  const [envs, setEnvs] = useState<string[]>([]);
  const [envsLoading, setEnvsLoading] = useState(true);
  const [logGroups, setLogGroups] = useState<string[]>([]);
  const [logGroupsLoading, setLogGroupsLoading] = useState(false);

  const [selectedEnvironment, setSelectedEnvironment] = useState("");
  const [selectedLogGroup, setSelectedLogGroup] = useState("");
  const [selectedRelease, setSelectedRelease] = useState("R24");    // default R24
  const [activeTab, setActiveTab] = useState("vulnerabilities");
  // rows to export (fed by VulnerabilityDashboard)
  const [exportRows, setExportRows] = useState<any[]>([]);
  const [seedSuggestions, setSeedSuggestions] = useState<Record<string, string>>({});
  
  // Vulnerabilities state
  const [vulnTimePeriod, setVulnTimePeriod] = useState("latest");
  const [vulnActiveFilters, setVulnActiveFilters] = useState<string[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  
  // Exceptions state
  const [excTimeRange, setExcTimeRange] = useState<"hourly" | "daily">("hourly");
  const [excCluster, setExcCluster] = useState("all");
  // const [excNamespace, setExcNamespace] = useState("all");
  const [excActiveFilters, setExcActiveFilters] = useState<string[]>([]);
  const [excPod, setExcPod] = useState("");


  useEffect(() => {
    (async () => {
      try {
        setEnvsLoading(true);
        const list = await getEnvironments();
        setEnvs(list);
        // set default env if none chosen yet
        if (!selectedEnvironment && list.length) {
          setSelectedEnvironment(list[0]);
        }
      } catch (e) {
        console.error("Failed to fetch environments", e);
        setEnvs([]); // keep app stable
      } finally {
        setEnvsLoading(false);
      }
    })();
  }, []); 

  useEffect(() => {
    if (!selectedEnvironment) {
      setLogGroups([]);
      setSelectedLogGroup("");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLogGroupsLoading(true);
        const groups = await getLogGroups(selectedEnvironment);
        if (cancelled) return;
        setLogGroups(groups);
        setSelectedLogGroup((prev) =>
          groups.length === 0 ? "" : groups.includes(prev) ? prev : groups[0]
        );
      } catch (e) {
        if (!cancelled) {
          console.error("Failed to fetch log groups", e);
          setLogGroups([]);
          setSelectedLogGroup("");
        }
      } finally {
        if (!cancelled) {
          setLogGroupsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedEnvironment]);

  useEffect(() => {
    if (envs.length && !envs.includes(selectedEnvironment)) {
      setSelectedEnvironment(envs[0]);
    }
  }, [envs, selectedEnvironment]);
 
  const handleVulnFilterRemove = (filter: string) => {
    setVulnActiveFilters(vulnActiveFilters.filter(f => f !== filter));
  };
 
  const handleExcFilterRemove = (filter: string) => {
    setExcActiveFilters(excActiveFilters.filter(f => f !== filter));
    
    // Reset corresponding state when filter is removed
    if (filter.startsWith("Cluster:")) {
      setExcCluster("all");
    }
    //  else if (filter.startsWith("Namespace:")) {
    //   setExcNamespace("all");
    // }
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
 
  const handleExportCsv = async () => {
    if (activeTab !== "vulnerabilities") return;
    const enriched = await enrichWithSuggestions(exportRows, { concurrency: 4 });

    const map: Record<string, string> = {};
    for (const v of enriched) {
      const key = suggestionKey(v);
      if (v.aiSuggestion) map[key] = v.aiSuggestion;
    }
    setSeedSuggestions(map);

    exportVulnerabilitiesToCSV(
      enriched,
      `vulnerabilities-${selectedEnvironment}-${new Date().toISOString().split("T")[0]}.csv`
    );

    setExportRows(enriched);
  };
 
  return (
    <div className="min-h-screen bg-background">
      <Header
        environments={envs}
        environmentsLoading={envsLoading}
        selectedEnvironment={selectedEnvironment}
        logGroups={logGroups}
        logGroupsLoading={logGroupsLoading}
        selectedLogGroup={selectedLogGroup}
        selectedRelease={selectedRelease}
        onEnvironmentChange={setSelectedEnvironment}
        onLogGroupChange={setSelectedLogGroup}
        onReleaseChange={(value) => setSelectedRelease(value ?? "")}
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
              namespace={activeTab === "exceptions" ? excPod : undefined}
              onNamespaceChange={activeTab === "exceptions" ? setExcPod : undefined}
              activeFilters={activeTab === "vulnerabilities" ? vulnActiveFilters : excActiveFilters}
              onRemoveFilter={activeTab === "vulnerabilities" ? handleVulnFilterRemove : handleExcFilterRemove}
              onExportCsv={handleExportCsv}
              repo={selectedRepo}
              onRepoChange={(value) => setSelectedRepo(value ?? "")}
              onEnvironmentChange={setSelectedEnvironment}
              onReleaseChange={(value) => setSelectedRelease(value ?? "")}

            />
            
            <TabsContent value="vulnerabilities" className="space-y-6">
              {selectedEnvironment ? (
                <VulnerabilityDashboard
                  environment={selectedEnvironment}
                  repo={selectedRepo}
                  release={selectedRelease}
                  timePeriod={vulnTimePeriod}
                  activeFilters={vulnActiveFilters}
                  onFiltersChange={setVulnActiveFilters}
                  onExportableRowsChange={setExportRows}
                  seedSuggestions={seedSuggestions}
                />
              ) : (
                <div className="text-center text-muted-forground mt-10">Select an environment to view data</div>
              )}
            </TabsContent>
            
            <TabsContent value="exceptions" className="space-y-6">
              <ExceptionsDashboard
                environment={selectedEnvironment}
                release={selectedRelease}
                cluster={excCluster}
                namespace={excPod}
                logGroupName={selectedLogGroup}
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
 