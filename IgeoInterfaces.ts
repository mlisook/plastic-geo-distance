/**
 * latitude / longitude as used in google maps
 */
interface Ilatlng {
    lat: number;
    lng: number;
}

/**
 * bounding geographic rectanagle
 */
interface Ibounds {
    minLat: number;
    minLng: number;
    maxLat: number;
    maxLng: number;
}

/**
 * function to check if a point is within a bounding rectangle
 */
interface IboundsFn {
    (point: Ilatlng): boolean;
}

/**
 * A geographic point with lat/lng in radians
 * and the cartesian coordinates appended
 */
interface Ilatlngxyz {
    lat: number;
    lng: number;
    x: number;
    y: number;
    z: number;
}

/**
 * cartesian representation of a lat/lng point
 */
interface Icartesian {
    x: number;
    y: number;
    z: number;
}

/**
 * result of a center of distance calculation
 */
interface IdistanceCenterResult {
    /**
     * center of distance point
     */
    point: Ilatlng;
    /**
     * average distance to points in the array
     */
    avgDist: number;
    /**
     * sum of distance to all array points
     */
    totalDist: number;
}