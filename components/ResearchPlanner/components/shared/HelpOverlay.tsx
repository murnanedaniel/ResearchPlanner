'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HelpOverlay() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed this
    const dismissed = localStorage.getItem('help-overlay-dismissed');
    if (!dismissed) {
      // Show overlay after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('help-overlay-dismissed', 'true');
  };

  if (isDismissed || !isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center pointer-events-none">
      <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md pointer-events-auto animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900">Welcome to ResearchGraph! 👋</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-3 text-sm text-slate-600">
          <p className="flex items-start gap-2">
            <span className="font-semibold text-slate-900 min-w-[140px]">🖱️ Double-click:</span>
            <span>Create a new node anywhere on the canvas</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="font-semibold text-slate-900 min-w-[140px]">📱 Right-click node:</span>
            <span>Access quick actions menu</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="font-semibold text-slate-900 min-w-[140px]">⌨️ Press ?:</span>
            <span>View all keyboard shortcuts</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="font-semibold text-slate-900 min-w-[140px]">🎯 Ctrl + Drag:</span>
            <span>Select multiple nodes at once</span>
          </p>
        </div>

        <Button onClick={handleDismiss} className="w-full mt-6">
          Got it, thanks!
        </Button>
      </div>
    </div>
  );
}
