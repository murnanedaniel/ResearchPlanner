import React from 'react';
import { useSettings } from '../../context/SettingsContext';

interface SettingItemProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
}

const SettingItem: React.FC<SettingItemProps> = ({ label, value, onChange, min = 1, max = 100, step = 1 }) => (
    <div className="flex flex-col gap-1 w-full">
        <div className="flex justify-between items-center">
            <label className="text-sm font-medium">{label}</label>
            <span className="text-sm text-gray-500">{value}</span>
        </div>
        <input
            type="range"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            min={min}
            max={max}
            step={step}
            className="w-full"
        />
    </div>
);

interface SettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
    const { settings, updateSettings, resetSettings } = useSettings();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-full">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Graph Settings</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>

                <div className="space-y-4">
                    <SettingItem
                        label="Node Radius"
                        value={settings.nodeRadius}
                        onChange={(value) => updateSettings({ nodeRadius: value })}
                        min={20}
                        max={100}
                    />
                    <SettingItem
                        label="Min Font Size"
                        value={settings.minFontSize}
                        onChange={(value) => updateSettings({ minFontSize: value })}
                        min={4}
                        max={settings.maxFontSize}
                    />
                    <SettingItem
                        label="Max Font Size"
                        value={settings.maxFontSize}
                        onChange={(value) => updateSettings({ maxFontSize: value })}
                        min={settings.minFontSize}
                        max={24}
                    />
                    <SettingItem
                        label="Edge Max Width"
                        value={settings.edgeMaxWidth}
                        onChange={(value) => updateSettings({ edgeMaxWidth: value })}
                        min={50}
                        max={300}
                    />
                    <SettingItem
                        label="Arrow Size"
                        value={settings.arrowSize}
                        onChange={(value) => updateSettings({ arrowSize: value })}
                        min={5}
                        max={20}
                    />
                    <SettingItem
                        label="Line Height"
                        value={settings.lineHeight}
                        onChange={(value) => updateSettings({ lineHeight: value })}
                        min={1}
                        max={2}
                        step={0.1}
                    />
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <button
                        onClick={resetSettings}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                    >
                        Reset to Defaults
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}; 