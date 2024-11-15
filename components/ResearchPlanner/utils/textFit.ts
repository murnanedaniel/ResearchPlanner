export function calculateFontSize(
    text: string, 
    maxWidth: number, 
    initialFontSize: number = 14,
    minFontSize: number = 8
): number {
    // Return initial size for SSR
    if (typeof document === 'undefined') return initialFontSize;
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return initialFontSize;

    let size = initialFontSize;
    context.font = `${size}px Inter`;
    let textWidth = context.measureText(text).width;

    while (size > minFontSize && textWidth > maxWidth) {
        size--;
        context.font = `${size}px Inter`;
        textWidth = context.measureText(text).width;
    }

    return size;
} 