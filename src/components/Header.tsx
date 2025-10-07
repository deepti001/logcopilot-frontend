import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import { Clock, GitBranch, Globe } from "lucide-react";

interface HeaderProps {
  selectedEnvironment: string;
  selectedRelease: string;
  onEnvironmentChange: (env: string) => void;
  onReleaseChange: (release: string) => void;
}

export function Header({
  selectedEnvironment,
  selectedRelease,
  onEnvironmentChange,
  onReleaseChange,
}: HeaderProps) {
  const environments = [
    {
      value: "prod",
      label: "Production",
      color: "bg-red-100 text-red-800",
    },
    {
      value: "stage",
      label: "Staging",
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      value: "test",
      label: "Test",
      color: "bg-green-100 text-green-800",
    },
  ];

  const releases = [
    "v2.1.4",
    "v2.1.3",
    "v2.1.2",
    "v2.1.1",
    "v2.1.0",
    "v2.0.9",
  ];

  const getCurrentEnvironmentInfo = () => {
    const env = environments.find(
      (e) => e.value === selectedEnvironment,
    );
    return env || environments[0];
  };

  return (
    <div className="border-b bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">
            LogCopilot (Monitor the tech health)
          </h1>
          <Badge
            variant="outline"
            className="flex items-center gap-1"
          >
            <Clock className="h-3 w-3" />
            Last Updated: {new Date().toLocaleTimeString()}
          </Badge>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <Select
              value={selectedEnvironment}
              onValueChange={onEnvironmentChange}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {environments.map((env) => (
                  <SelectItem key={env.value} value={env.value}>
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-2 h-2 rounded-full ${env.color.split(" ")[0]}`}
                      />
                      <span>{env.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <GitBranch className="h-4 w-4 text-muted-foreground" />
            <Select
              value={selectedRelease}
              onValueChange={onReleaseChange}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {releases.map((release) => (
                  <SelectItem key={release} value={release}>
                    {release}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Badge className={getCurrentEnvironmentInfo().color}>
            {getCurrentEnvironmentInfo().label}
          </Badge>
        </div>
      </div>
    </div>
  );
}