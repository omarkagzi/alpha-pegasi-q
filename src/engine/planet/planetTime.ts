// In a real production app, this would sync with a server endpoint.
// For now, it computes the sun position based on a localized real-time clock.

export const simulatePlanetTime = () => {
    const DAY_CYCLE_MINUTES = 24;
    const now = Date.now();
    
    // Convert real time into our game time cycle
    // One full 24 real-world minute cycle = 1 in-game day
    const cycleMs = DAY_CYCLE_MINUTES * 60 * 1000;
    const timeInCycle = now % cycleMs;
    const normalizedTime = timeInCycle / cycleMs; // 0.0 to 1.0
    
    return normalizedTime;
};

// Calculate the sun's direction vector based on the normalized time (0 to 1)
export const getSunDirection = (normalizedTime: number) => {
    // One full day is 2 * PI radians.
    // Setting up the sun to rotate around the Y-axis (equatorial plane).
    const angle = normalizedTime * Math.PI * 2;
    
    const x = Math.cos(angle);
    const z = Math.sin(angle);
    const y = 0.2; // slight offset so the sun isn't perfectly equatorial
    
    return [x, y, z];
};
