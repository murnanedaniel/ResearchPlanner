import React, { createContext, useContext, useState, useEffect } from 'react';
import { GRAPH_CONSTANTS } from '../constants';

interface Settings {
    nodeRadius: number;
    minFontSize: number;
    maxFontSize: number;
    edgeMaxWidth: number;
    arrowSize: number;
    lineHeight: number;
    hierarchyLevelScale: number;
}

interface SettingsContextType {
    settings: Settings;
    updateSettings: (newSettings: Partial<Settings>) => void;
    resetSettings: () => void;
}

const defaultSettings: Settings = {
    nodeRadius: GRAPH_CONSTANTS.NODE_RADIUS,
    minFontSize: GRAPH_CONSTANTS.MIN_FONT_SIZE,
    maxFontSize: GRAPH_CONSTANTS.MAX_FONT_SIZE,
    edgeMaxWidth: GRAPH_CONSTANTS.EDGE_MAX_WIDTH,
    arrowSize: GRAPH_CONSTANTS.ARROW_SIZE,
    lineHeight: GRAPH_CONSTANTS.LINE_HEIGHT,
    hierarchyLevelScale: GRAPH_CONSTANTS.HIERARCHY_LEVEL_SCALE
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    // Initialize with default settings
    const [settings, setSettings] = useState<Settings>(defaultSettings);

    // Load settings from localStorage once mounted
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedSettings = localStorage.getItem('graphSettings');
            if (savedSettings) {
                try {
                    setSettings(JSON.parse(savedSettings));
                } catch (e) {
                    console.error('Failed to parse saved settings:', e);
                }
            }
        }
    }, []);

    // Save settings to localStorage whenever they change
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('graphSettings', JSON.stringify(settings));
        }
    }, [settings]);

    const updateSettings = (newSettings: Partial<Settings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    const resetSettings = () => {
        setSettings(defaultSettings);
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
} 