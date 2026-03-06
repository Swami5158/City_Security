import fs from 'fs';
import path from 'path';

interface TimeRule {
  role: string;
  writeAccess: { startHour: number; endHour: number };
  outsideHoursPermissions: string[];
}

interface DistrictRule {
  role: string;
  restrictToDistrict: boolean;
}

class DynamicPermissionService {
  private timeRules: TimeRule[] = [];
  private districtRules: DistrictRule[] = [];

  constructor() {
    this.loadPolicy();
  }

  private loadPolicy() {
    try {
      const configPath = path.join(process.cwd(), 'config', 'access-policy.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      this.timeRules = config.timeBasedRules;
      this.districtRules = config.districtRules;
    } catch (error) {
      console.error('Failed to load access policy:', error);
    }
  }

  checkTimeBasedAccess(role: string, permission: string): boolean {
    const rule = this.timeRules.find(r => r.role === role);
    if (!rule) return true;

    const hour = new Date().getHours();
    const isWithinHours = hour >= rule.writeAccess.startHour && hour < rule.writeAccess.endHour;

    if (!isWithinHours) {
      // If it's a "write" action (manage/control/override), check if it's allowed outside hours
      const isWriteAction = permission.includes('manage') || permission.includes('control') || permission.includes('override');
      if (isWriteAction && !rule.outsideHoursPermissions.includes(permission)) {
        return false;
      }
    }

    return true;
  }

  checkDistrictAccess(user: any, assetDistrict: string): boolean {
    const rule = this.districtRules.find(r => r.role === user.role);
    if (!rule || !rule.restrictToDistrict) return true;

    return user.district === assetDistrict;
  }
}

export const dynamicPermissionService = new DynamicPermissionService();
