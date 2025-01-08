'use client';

import React, { useEffect, useState } from 'react';
import { useTransformContext } from 'react-zoom-pan-pinch';
import { getTimelineConfig, getPixelsPerUnit, dateToX, formatDate } from '../../utils/timeline';
import type { TimelineConfig } from '../../utils/timeline';
import { GRAPH_CONSTANTS } from '../../constants';

interface TimelineGridProps {
  startDate: Date;
  className?: string;
  scale: number;
  transformState?: {
    positionX: number;
    positionY: number;
    scale: number;
  };
}

export function TimelineGrid({ startDate, className = '', scale, transformState }: TimelineGridProps) {
  // Calculate inverse scale to maintain constant text size
  const inverseScale = 1 / (transformState?.scale || 1);
  
  // Scale the buffer with zoom level
  const baseBuffer = 20;
  const scaledBuffer = baseBuffer / (transformState?.scale || 1);
  
  // Calculate the y-position for the text labels
  // If we're scrolled down (positionY is negative), offset the text to stay in view
  const textY = Math.max(scaledBuffer, -(transformState?.positionY || 0) / (transformState?.scale || 1) + scaledBuffer);
  const todayLabelY = textY + scaledBuffer;  // Place "Today" label slightly below date labels
  
  // Get timeline configuration
  const timeScale = getTimelineConfig(scale);
  const pixelsPerUnit = getPixelsPerUnit(timeScale);
  const config: TimelineConfig = {
    scale: timeScale,
    pixelsPerUnit,
    startDate
  };

  // Calculate visible range with buffer
  const calculateVisibleRange = () => {
    if (!transformState) return { start: 0, end: GRAPH_CONSTANTS.CANVAS_SIZE };

    const { positionX, scale: zoom } = transformState;
    const bufferSize = window.innerWidth * 0.2; // 20% buffer on each side
    
    // Convert screen coordinates to graph coordinates
    const visibleStart = -positionX / zoom - bufferSize;
    const visibleEnd = (-positionX + window.innerWidth) / zoom + bufferSize;

    return {
      start: Math.max(0, visibleStart),
      end: Math.min(GRAPH_CONSTANTS.CANVAS_SIZE, visibleEnd)
    };
  };
  
  // Calculate grid lines for the visible portion of the canvas
  const calculateGridLines = () => {
    const { start, end } = calculateVisibleRange();
    const lines = [];
    
    // Calculate number of units based on time scale
    const unitsToShow = {
      monthly: 60,  // 5 years * 12 months
      weekly: 260,  // 5 years * 52 weeks
      daily: 1825   // 5 years * 365 days
    }[timeScale];
    
    for (let i = 0; i <= unitsToShow; i++) {
      const x = i * pixelsPerUnit;
      // Only add lines that are within the visible range
      if (x < start) continue;
      if (x > end) break;
      
      const date = new Date(startDate);
      if (timeScale === 'monthly') {
        date.setMonth(date.getMonth() + i);
      } else if (timeScale === 'weekly') {
        date.setDate(date.getDate() + i * 7);
      } else {
        date.setDate(date.getDate() + i);
      }
      
      lines.push({
        x,
        label: formatDate(date, timeScale)
      });
    }
    
    return lines;
  };
  
  const gridLines = calculateGridLines();
  const currentDateX = dateToX(new Date(), config);
  const { start, end } = calculateVisibleRange();

  return (
    <g className={`timeline-grid ${className}`}>
      {/* Grid lines */}
      {gridLines.map(line => (
        <React.Fragment key={line.x}>
          <line
            x1={line.x}
            x2={line.x}
            y1={0}
            y2={10000}
            className="stroke-slate-200"
            strokeWidth={1}
          />
          <text
            x={line.x}
            y={textY}
            className="fill-slate-400 text-sm"
            textAnchor="middle"
            transform={`scale(${inverseScale})`}
            style={{ transformOrigin: `${line.x}px ${textY}px` }}
          >
            {line.label}
          </text>
        </React.Fragment>
      ))}
      
      {/* Current date line - only show if in visible range */}
      {currentDateX >= start && currentDateX <= end && (
        <>
          {/* Today label - positioned to the left */}
          <text
            x={currentDateX - 10}
            y={todayLabelY}
            className="fill-blue-500 text-sm font-medium"
            textAnchor="end"
            dominantBaseline="middle"
            transform={`scale(${inverseScale})`}
            style={{ transformOrigin: `${currentDateX - 10}px ${todayLabelY}px` }}
          >
            Today
          </text>
          {/* Current date line */}
          <line
            x1={currentDateX}
            x2={currentDateX}
            y1={0}
            y2={10000}
            className="stroke-blue-500"
            strokeWidth={2}
          />
        </>
      )}
    </g>
  );
} 