'use client';

import { useState, useEffect } from 'react';
import { calculateFontSize } from '../utils/textFit';

export function useTextFit(text: string, maxWidth: number, initialFontSize: number = 14) {
    const [fontSize, setFontSize] = useState(initialFontSize);

    useEffect(() => {
        const newSize = calculateFontSize(text, maxWidth, initialFontSize);
        setFontSize(newSize);
    }, [text, maxWidth, initialFontSize]);

    return fontSize;
} 