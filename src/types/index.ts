export interface User {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  district: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface InfrastructureAsset {
  id: string;
  name: string;
  type: string;
  location: string;
  district: string;
  status: 'active' | 'maintenance' | 'offline';
  config: any;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  role: string;
  endpoint: string;
  action: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  deniedReason: string | null;
  beforeState: any;
  afterState: any;
  isEmergency: boolean;
  isFlagged: boolean;
  timestamp: string;
}

export interface ThreatAlert {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  userId: string | null;
  userEmail: string | null;
  description: string;
  resolvedAt: string | null;
  isResolved: boolean;
  createdAt: string;
}

export interface SecurityReport {
  id: string;
  generatedAt: string;
  period: string;
  summary: {
    totalRequests: number;
    failedAttempts: number;
    emergencyOverrides: number;
    flaggedEvents: number;
    uniqueUsers: number;
  };
  reportData: {
    actionBreakdown: Record<string, number>;
    topUsers: { email: string; count: number }[];
    recentFlagged: AuditLog[];
  };
  generatedBy: string;
}
