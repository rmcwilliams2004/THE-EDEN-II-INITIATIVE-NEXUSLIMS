import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type NavigationTab = 
  | 'LAUNCHPAD'
  | 'FEED'
  | 'FARM_COMMAND'
  | 'TOUCHSCREEN'
  | 'DASHBOARD'
  | 'KIOSK'
  | 'ONBOARDING'
  | 'ECOCREDITX'
  | 'VCM'
  | 'MARKET_NEWS'
  | 'ASSET_MAP'
  | 'VOICE_ASSISTANT'
  | 'VIDEO_GEN'
  | 'SETTINGS'
  | 'MAP'
  | 'ANALYTICS';

export interface NavItemConfig {
  id: NavigationTab;
  label: string;
  shortLabel?: string;
  badge?: string;
  group?: 'primary' | 'field' | 'compliance' | 'tools';
}

export const NAV_ITEMS: NavItemConfig[] = [
  { id: 'LAUNCHPAD', label: 'Launchpad Grid', shortLabel: 'Launchpad', group: 'primary' },
  { id: 'FEED', label: 'Sister-Link Feed', shortLabel: 'Feed', group: 'primary' },
  { id: 'DASHBOARD', label: 'Live Telemetry & SIL-3', shortLabel: 'Telemetry', group: 'primary' },
  { id: 'KIOSK', label: '20-ft Sister Kiosk (Voice/NFC)', shortLabel: 'Sister Kiosk', group: 'primary' },
  { id: 'FARM_COMMAND', label: 'Farm Command (Overview)', shortLabel: 'Farm Command', group: 'field' },
  { id: 'MAP', label: 'GIS Heatmap & Contours', shortLabel: 'GIS Heatmap', group: 'field' },
  { id: 'ANALYTICS', label: 'Soil & Crop Analytics', shortLabel: 'Crop Analytics', group: 'field' },
  { id: 'TOUCHSCREEN', label: 'Eden II Touchscreen HMI', shortLabel: 'HMI Touchscreen', group: 'field' },
  { id: 'MARKET_NEWS', label: 'Market & Carbon Intelligence (Grounding)', shortLabel: 'Market Intel', badge: 'Live AI', group: 'compliance' },
  { id: 'ECOCREDITX', label: 'EcoCreditX Hedera dMRV', shortLabel: 'EcoCreditX', group: 'compliance' },
  { id: 'VCM', label: 'Carbon Credits (VCM)', shortLabel: 'Carbon VCM', group: 'compliance' },
  { id: 'ONBOARDING', label: 'Section 179 & Grants', shortLabel: 'Section 179', group: 'compliance' },
  { id: 'ASSET_MAP', label: 'Hardware Asset Map', shortLabel: 'Asset Map', group: 'tools' },
  { id: 'VOICE_ASSISTANT', label: 'Universal Translator', shortLabel: 'Voice AI', group: 'tools' },
  { id: 'VIDEO_GEN', label: 'Neural Video Gen', shortLabel: 'Video Gen', group: 'tools' },
  { id: 'SETTINGS', label: 'System Settings & Interlocks', shortLabel: 'Settings', group: 'tools' },
];

interface NavigationContextType {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  isFarmActive: boolean;
  navItems: NavItemConfig[];
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: ReactNode; initialTab?: NavigationTab }> = ({ 
  children, 
  initialTab = 'LAUNCHPAD' 
}) => {
  const [activeTab, setActiveTab] = useState<NavigationTab>(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace('#', '').toUpperCase() as NavigationTab;
      if (NAV_ITEMS.some(item => item.id === hash) || hash === 'MAP' || hash === 'ANALYTICS') {
        return hash;
      }
    }
    // Check saved default tab preference from localStorage
    try {
      const savedDefault = localStorage.getItem('nexuslims_default_tab_pref') as NavigationTab;
      if (savedDefault && NAV_ITEMS.some(item => item.id === savedDefault)) {
        return savedDefault;
      }
    } catch {
      // Fallback
    }
    return initialTab;
  });

  // Sync with browser URL hash or storage if needed
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').toUpperCase() as NavigationTab;
      if (NAV_ITEMS.some(item => item.id === hash) || hash === 'MAP' || hash === 'ANALYTICS') {
        setActiveTab(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSetActiveTab = (tab: NavigationTab) => {
    setActiveTab(tab);
    window.location.hash = tab.toLowerCase();
  };

  const isFarmActive = activeTab === 'FARM_COMMAND' || activeTab === 'MAP' || activeTab === 'ANALYTICS';

  return (
    <NavigationContext.Provider 
      value={{ 
        activeTab, 
        setActiveTab: handleSetActiveTab, 
        isFarmActive,
        navItems: NAV_ITEMS
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
