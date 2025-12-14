# Performance Optimization

This document describes the performance optimizations implemented in ResearchPlanner, particularly for pan/zoom interactions.

## Pan/Zoom Performance

The graph canvas uses `react-zoom-pan-pinch` for pan and zoom interactions. The following optimizations have been implemented to achieve smooth, responsive 60fps interactions:

### Velocity Panning

Momentum/velocity panning is enabled to provide a natural, fluid feel similar to tools like Figma and Miro:

```typescript
panning: {
  velocityDisabled: false,  // Enable momentum scrolling
  excluded: ['node-drag-handle']
}
```

This allows the canvas to continue moving briefly after you finish panning, creating a more natural interaction.

### Smooth Wheel Scrolling

Smooth wheel and trackpad zooming is configured for buttery-smooth zoom interactions:

```typescript
wheel: {
  smoothStep: 0.005,  // Very smooth incremental zoom
  step: 0.1           // Standard zoom step for non-smooth devices
}
```

The `smoothStep` value provides incremental zoom updates for trackpad pinch gestures and smooth-scroll mice.

### Animation Configuration

All animations are tuned for snappy, responsive feel:

#### Velocity Animation
```typescript
velocityAnimation: {
  disabled: false,
  sensitivity: 1,
  animationTime: 400,      // Natural deceleration time
  animationType: "easeOutQuad"  // Smooth deceleration curve
}
```

#### Zoom Animation
```typescript
zoomAnimation: {
  animationTime: 200,      // Snappy zoom response
  animationType: "easeOutQuad"
}
```

#### Alignment Animation
```typescript
alignmentAnimation: {
  animationTime: 200,
  velocityAlignmentTime: 200,
  animationType: "easeOutQuad"
}
```

### DOM Update Optimization

The `onTransformed` callback is optimized to only update DOM attributes when values change significantly:

```typescript
onTransformed: (ref, state) => {
  setCurrentScale(state.scale);
  setTransformState(state);
  
  // Throttle DOM updates - only update if changed significantly
  const scaleChanged = Math.abs(state.scale - lastUpdate.scale) > 0.001;
  const posXChanged = Math.abs(state.positionX - lastUpdate.positionX) > 1;
  const posYChanged = Math.abs(state.positionY - lastUpdate.positionY) > 1;
  
  if (scaleChanged || posXChanged || posYChanged) {
    // Update DOM attributes
  }
}
```

This prevents unnecessary DOM operations on every animation frame, improving overall performance.

## Performance Characteristics

### Expected Performance
- **Frame Rate**: Smooth 60fps during pan/zoom operations
- **Zoom Response**: < 200ms from input to visual feedback
- **Pan Momentum**: Natural deceleration over ~400ms
- **Wheel Zoom**: Incremental, smooth response to trackpad/wheel input

### Optimization Techniques
1. **Throttled DOM Updates**: Reduces unnecessary setAttribute calls
2. **Fast Animation Curves**: easeOutQuad provides good balance of smoothness and speed
3. **Optimized Animation Durations**: 200ms for immediate actions, 400ms for momentum
4. **Velocity Sensitivity**: Tuned to feel natural without being oversensitive

## Browser Considerations

These optimizations work best on modern browsers with:
- Hardware-accelerated CSS transforms
- Smooth scroll support
- High refresh rate displays (60Hz+)

For older browsers or devices, the interactions will still work but may feel less fluid.

## Future Improvements

Potential areas for further optimization:
- Virtualization for graphs with 1000+ nodes
- Web Workers for heavy calculations
- Canvas rendering for very large graphs
- GPU-accelerated rendering with WebGL
