// /src/components/Header.tsx

import React from "react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import { Clock, GitBranch, Globe } from "lucide-react";

interface HeaderProps {
  environments: string[];
  environmentsLoading: boolean;
  selectedEnvironment: string;
  selectedRelease: string;
  onEnvironmentChange: (env: string) => void;
  onReleaseChange: (release: string) => void;
}

export function Header({
  environments,
  environmentsLoading,
  selectedEnvironment,
  selectedRelease,
  onEnvironmentChange,
  onReleaseChange,
}: HeaderProps) {

  const envColor = (e: string) =>
    e.includes("prod") ? "bg-red-100 text-red-800"
    : e.includes("uat") ? "bg-yellow-100 text-yellow-800"
    : "bg-green-100 text-green-800";

  const currentEnv = selectedEnvironment || (environments[0] ?? "");

  return (
    <div className="border-b bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">LogCopilot (Monitor the tech health)</h1>
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Last Updated: {new Date().toLocaleTimeString()}
          </Badge>
        </div>

        <div className="flex items-center space-x-4">
          {/* Environment */}
          <div className="flex items-center space-x-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <Select
              value={selectedEnvironment}
              onValueChange={onEnvironmentChange}
              disabled={environmentsLoading || environments.length === 0}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder={environmentsLoading ? "Loading..." : "Select Environment"} />
              </SelectTrigger>
              <SelectContent>
                {environments.map((env) => (
                  <SelectItem key={env} value={env}>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${envColor(env).split(" ")[0]}`} />
                      <span>{env}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Release (read-only, driven by selectedRelease) */}
          <div className="flex items-center space-x-2">
            <GitBranch className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedRelease} disabled>
              <SelectTrigger className="w-24 cursor-not-allowed opacity-70">
                <SelectValue placeholder="Release" />
              </SelectTrigger>
              <SelectContent>
                {selectedRelease && (
                  <SelectItem value={selectedRelease}>{selectedRelease}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>


          {/* Badge */}
          <Badge className={currentEnv ? envColor(currentEnv) : "bg-gray-100 text-gray-800"}>
            {environmentsLoading ? "Loading..." : currentEnv || "No Env"}
          </Badge>
        </div>
      </div>
    </div>
  );
}
