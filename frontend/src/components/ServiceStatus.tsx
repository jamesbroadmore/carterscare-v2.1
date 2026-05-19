/**
 * Service Status Component
 * Real-time indicator for service availability (available / offline / backup)
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Wifi, WifiOff, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";

export type ServiceStatus = "online" | "offline" | "backup" | "maintenance";

interface ServiceState {
  status: ServiceStatus;
  lastChecked: Date;
  message?: string;
}

// Service status configuration
const STATUS_CONFIG: Record<ServiceStatus, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  online: { 
    label: "Online", 
    color: "text-green-600", 
    bgColor: "bg-green-100",
    icon: CheckCircle 
  },
  offline: { 
    label: "Offline", 
    color: "text-red-600", 
    bgColor: "bg-red-100",
    icon: WifiOff 
  },
  backup: { 
    label: "Backup Mode", 
    color: "text-amber-600", 
    bgColor: "bg-amber-100",
    icon: AlertTriangle 
  },
  maintenance: { 
    label: "Maintenance", 
    color: "text-blue-600", 
    bgColor: "bg-blue-100",
    icon: RefreshCw 
  },
};

// Hook to monitor service status
export function useServiceStatus(): ServiceState {
  const [state, setState] = useState<ServiceState>({
    status: "online",
    lastChecked: new Date(),
  });

  useEffect(() => {
    // Check service status periodically
    const checkStatus = async () => {
      try {
        // In real implementation, this would call a health check endpoint
        const response = await fetch("/api/health", { method: "HEAD" }).catch(() => null);
        
        setState({
          status: response?.ok ? "online" : "backup",
          lastChecked: new Date(),
          message: response?.ok ? undefined : "Using cached data",
        });
      } catch {
        setState({
          status: "offline",
          lastChecked: new Date(),
          message: "Connection lost",
        });
      }
    };

    // Initial check
    checkStatus();

    // Check every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return state;
}

// Service Status Badge Component
export function ServiceStatusBadge({ 
  size = "sm",
  showLabel = true,
}: { 
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}) {
  const { status, lastChecked, message } = useServiceStatus();
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "h-6 px-2 text-xs gap-1",
    md: "h-8 px-3 text-sm gap-1.5",
    lg: "h-10 px-4 text-sm gap-2",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center rounded-full ${config.bgColor} ${config.color} ${sizeClasses[size]} font-medium`}
      title={message || `Last checked: ${lastChecked.toLocaleTimeString()}`}
    >
      <Icon className={iconSizes[size]} />
      {showLabel && <span>{config.label}</span>}
      {status === "online" && (
        <span className="relative flex h-2 w-2 ml-1">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
      )}
    </motion.div>
  );
}

// Full Service Status Panel
export function ServiceStatusPanel() {
  const { status, lastChecked, message } = useServiceStatus();
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <div className={`rounded-xl border p-4 ${config.bgColor} border-opacity-50`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-full ${config.bgColor} flex items-center justify-center`}>
            <Icon className={`h-5 w-5 ${config.color}`} />
          </div>
          <div>
            <p className={`text-sm font-semibold ${config.color}`}>{config.label}</p>
            <p className="text-xs text-slate-500">
              {message || `All systems operational`}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Last checked</p>
          <p className="text-xs font-medium text-slate-600">
            {lastChecked.toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
}

// Compact Status Dot
export function StatusDot({ status }: { status: ServiceStatus }) {
  const config = STATUS_CONFIG[status];
  
  return (
    <div className="relative">
      <div className={`h-3 w-3 rounded-full ${config.bgColor}`} />
      {status === "online" && (
        <div className="absolute inset-0">
          <div className="h-3 w-3 rounded-full bg-green-400 animate-ping" />
        </div>
      )}
    </div>
  );
}

export default ServiceStatusBadge;
