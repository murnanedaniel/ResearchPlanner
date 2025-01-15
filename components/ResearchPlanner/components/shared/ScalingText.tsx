'use client';

import React, { useRef, useState, useEffect } from 'react';
import { GRAPH_CONSTANTS, getGraphConstant } from '../../constants';
import { useSettings } from '../../context/SettingsContext';

interface ScalingTextProps {
    text: string;
    maxLines?: number;
    className?: string;
    verticalAlign?: 'top' | 'center';
}

export function ScalingText({ 
    text, 
    maxLines = 4, 
    className = '',
    verticalAlign = 'center'
}: ScalingTextProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLParagraphElement>(null);
    const [scale, setScale] = useState(1);
    const { settings } = useSettings();
    
    useEffect(() => {
        if (!containerRef.current || !textRef.current) return;
        
        const container = containerRef.current;
        const textElement = textRef.current;
        
        // Temporarily remove transform to measure true height
        textElement.style.transform = '';
        
        const maxFontSize = getGraphConstant('MAX_FONT_SIZE', settings);
        const minFontSize = getGraphConstant('MIN_FONT_SIZE', settings);
        const lineHeight = maxFontSize * getGraphConstant('LINE_HEIGHT', settings);
        const maxHeight = lineHeight * maxLines;
        
        // Check if content exceeds max height
        const contentHeight = textElement.scrollHeight;
        
        if (contentHeight > maxHeight) {
            const newScale = maxHeight / contentHeight;
            const minScale = minFontSize / maxFontSize;
            setScale(Math.max(newScale, minScale));
        } else {
            setScale(1);
        }
        
        // Restore transform based on current scale
        textElement.style.transform = `scale(${scale})`;
    }, [text, maxLines, settings]);

    const maxFontSize = getGraphConstant('MAX_FONT_SIZE', settings);
    const lineHeight = maxFontSize * getGraphConstant('LINE_HEIGHT', settings);

    return (
        <div 
            ref={containerRef}
            className={`flex justify-center overflow-hidden ${verticalAlign === 'center' ? 'items-center' : 'items-start'} ${className}`}
            style={{ 
                height: `${lineHeight * maxLines}px`
            }}
        >
            <p 
                ref={textRef}
                className="text-center w-full leading-[1.2]"
                style={{ 
                    transform: `scale(${scale})`,
                    transformOrigin: verticalAlign === 'center' ? 'center center' : 'top center',
                    wordBreak: 'break-word',
                    fontSize: `${maxFontSize}px`
                }}
            >
                {text}
            </p>
        </div>
    );
} 