"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class PlasticGeoDistance {
    /**
     * construct new instance
     * @param {units} - miles, kilometers, m, k. Uses first letter. Default Miles.
     */
    constructor(units) {
        this._units = units ? (units.toUpperCase().substring(0, 1) === "K" ? "K" : "M") : "M";
        this._earthRadius = this._units === "K" ? 6371 : 3958.756;
    }
    /**
     * Calculate bounding rectangle for a distance from a point.
     * If not given, the instance radius and pointA are used.
     *
     * Credit for this technique: Jan Matuschek http://JanMatuschek.de/LatitudeLongitudeBoundingCoordinates
     *
     * @param {distance} - radius in the instance units (miles, kilometers)
     * @param {point} - center point lat/lng in degrees
     */
    bounds(distance, point) {
        let pA = this.geoToRadians(point);
        let dist = distance;
        if (isNaN(dist) || dist <= 0) {
            return {
                minLat: pA.lat,
                minLng: pA.lng,
                maxLat: pA.lat,
                maxLng: pA.lng
            };
        }
        // constants
        const EARTH_RADIUS = this._earthRadius;
        const MIN_LAT = this.toRadians(-90);
        const MAX_LAT = this.toRadians(90);
        const MIN_LON = this.toRadians(-180);
        const MAX_LON = this.toRadians(180);
        // calculate latitude bounds
        let radDist = dist / EARTH_RADIUS;
        let minLat = pA.lat - radDist;
        let maxLat = pA.lat + radDist;
        // calculate delta of longitude
        let deltaLng = Math.asin(Math.sin(radDist) / Math.cos(pA.lat));
        let minLon = 0;
        let maxLon = 0;
        // if the bounds do not cover one of the poles
        if (minLat > MIN_LAT && maxLat < MAX_LAT) {
            minLon = pA.lng - deltaLng;
            maxLon = pA.lng + deltaLng;
            if (minLon < MIN_LON) {
                minLon = minLon + 2 * Math.PI;
            }
            if (maxLon > MAX_LON) {
                maxLon = maxLon - 2 * Math.PI;
            }
        }
        else {
            minLat = Math.max(minLat, MIN_LAT);
            maxLat = Math.min(maxLat, MAX_LAT);
            minLon = MIN_LON;
            maxLon = MAX_LON;
        }
        return {
            minLng: this.toDegrees(minLon),
            maxLng: this.toDegrees(maxLon),
            minLat: this.toDegrees(minLat),
            maxLat: this.toDegrees(maxLat)
        };
    }
    /**
     * Calculate the distance between the two points
     * if one or both points are not given, the instance points A and B are used.
     * Uses the Haversine formula - credit: http://www.movable-type.co.uk/scripts/latlong.html
     * @param {point1} - first point lat/lng in degrees
     * @param {point2} - second point lat/lng in degrees
     * @return distance in instance units
     */
    distance(point1, point2) {
        const R = this._earthRadius;
        // set up parameter values, if given
        let pA = this.geoToRadians(point1);
        let pB = this.geoToRadians(point2);
        let c = this.radianDistance(pA, pB);
        let d = R * c;
        return (isNaN(d) ? 0 : d);
    }
    /**
     * radianDistance - calculates the distance in radians between two
     * points that are expressed in radians
     */
    radianDistance(pA, pB) {
        // Haversine credit: http://www.movable-type.co.uk/scripts/latlong.html
        let dLat = (pB.lat - pA.lat);
        let dLon = (pB.lng - pA.lng);
        let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(pA.lat) * Math.cos(pB.lat) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
    /**
     * Convert a degrees point to a radians point
     */
    geoToRadians(geo) {
        return { lat: this.toRadians(geo.lat), lng: this.toRadians(geo.lng) };
    }
    /**
     * geoToDegrees - convert a radians point to degrees
     */
    geoToDegrees(geoR) {
        return { lat: this.toDegrees(geoR.lat), lng: this.toDegrees(geoR.lng) };
    }
    /**
     * get a bounds checking function
     */
    getBoundsCheckFunction(distance, point) {
        let m = this.bounds(distance, point);
        return (latlng) => { return this.isInBounds(latlng, m); };
    }
    /**
     * is inside bounding rectangle
     */
    isInBounds(point, bounds) {
        return (point.lat >= bounds.minLat && point.lat <= bounds.maxLat) &&
            (bounds.minLng > bounds.maxLng ? (point.lng >= bounds.minLng || point.lng <= bounds.maxLng) :
                (point.lng >= bounds.minLng && point.lng <= bounds.maxLng));
    }
    /**
     * Convert degrees to radians
     */
    toRadians(degrees) {
        return degrees * Math.PI / 180;
    }
    /**
     * Convert radians to degrees
     */
    toDegrees(rad) {
        return rad * 180 / Math.PI;
    }
    /**
     * computeMidpoint - Finds the geographic center of an array of latlng
     */
    computeMidpoint(points) {
        let m = this._computeAverageCoordinates(this._toCenteringArray(points));
        return this.geoToDegrees(m);
    }
    distanceToPointList(fromPoint, toPoints) {
        let fp = this.geoToRadians(fromPoint);
        let pCA = this._toCenteringArray(toPoints);
        let result = {
            point: fromPoint,
            avgDist: 0,
            totalDist: this._sumRadianDistance({ lat: fp.lat, lng: fp.lng, x: 0, y: 0, z: 0 }, pCA)
        };
        result.point = this.geoToDegrees(result.point);
        result.totalDist = result.totalDist * this._earthRadius;
        result.avgDist = result.totalDist / toPoints.length;
        return result;
    }
    /**
     * computeMinimumDistancePoint - Finds the point with the minimum total
     * distance to all points in an array of lat/lng.
     *
     * Adapted from http://www.geomidpoint.com/calculation.html - B. Center of minimum distance
     */
    computeMinimumDistancePoint(points) {
        let result = { point: { lat: 0, lng: 0 }, avgDist: 0, totalDist: 0 };
        if (!points || points.length == 0) {
            return result;
        }
        if (points.length == 1) {
            result.point.lat = points[0].lat;
            result.point.lng = points[0].lng;
            return result;
        }
        let pCA = this._toCenteringArray(points);
        let midPt = this._computeAverageCoordinates(pCA);
        let currentBest = { point: midPt, avgDist: 0, totalDist: this._sumRadianDistance(midPt, pCA) };
        // test all points in the array itself as a new possible center
        currentBest = this._testCandidateCenterPoints(pCA, pCA, currentBest);
        // form a decreasing size circle of 8 points around the current best
        // point and test each as a possible new best point.  16 iterations is
        // enough to ensure accuracy down to 0.1 miles so this function uses 17 
        // iterations
        let testRadius = Math.PI / 2;
        for (let r = 0; r < 17; r++) {
            let cbd = 200000 + currentBest.totalDist;
            while (currentBest.totalDist < cbd) {
                let candidatePts = [];
                for (let i = 0; i < 8; i++) {
                    let dp = this._destinationPointRadians(currentBest.point, Math.PI / 4 * i, testRadius);
                    candidatePts.push({ lat: dp.lat, lng: dp.lng, x: 0, y: 0, z: 0 });
                }
                cbd = currentBest.totalDist;
                currentBest = this._testCandidateCenterPoints(candidatePts, pCA, currentBest);
            }
            testRadius = testRadius / 2;
        }
        // convert to degrees and return
        result.point = this.geoToDegrees(currentBest.point);
        result.totalDist = currentBest.totalDist * this._earthRadius;
        result.avgDist = result.totalDist / points.length;
        return result;
    }
    /**
     * toCenteringArray - Converts an array of latlng in degrees
     * to an array of latlng in radians plus the x, y, z cartesian coordinates
     *
     * Adapted from http://www.geomidpoint.com/calculation.html - A. Geographic midpoint
     */
    _toCenteringArray(sourceArray) {
        let result = [];
        for (let p of sourceArray) {
            let latr = this.toRadians(p.lat);
            let lngr = this.toRadians(p.lng);
            result.push({
                lat: latr,
                lng: lngr,
                x: Math.cos(latr) * Math.cos(lngr),
                y: Math.cos(latr) * Math.sin(lngr),
                z: Math.sin(latr)
            });
        }
        return result;
    }
    /**
     * computeAverageCoordinates - computes the average x, y, and z of an array of cartesian points
     *
     * Adapted from http://www.geomidpoint.com/calculation.html - A. Geographic midpoint
     */
    _computeAverageCoordinates(points) {
        let result = { lat: 0, lng: 0, x: 0, y: 0, z: 0 };
        if (points && points.length > 0) {
            for (let p of points) {
                result.x += p.x;
                result.y += p.y;
                result.z += p.z;
            }
            result.x = result.x / points.length;
            result.y = result.y / points.length;
            result.z = result.z / points.length;
            return this._cartesianToRadians(result);
        }
        return result;
    }
    /**
     * cartesianToRadians - converts x, y, z cartesian coordinates to lat/lng in radians
     *
     * Adapted from http://www.geomidpoint.com/calculation.html - A. Geographic midpoint
     */
    _cartesianToRadians(cartesianPoint) {
        return {
            lng: Math.atan2(cartesianPoint.y, cartesianPoint.x),
            lat: Math.atan2(cartesianPoint.z, Math.sqrt(cartesianPoint.x * cartesianPoint.x + cartesianPoint.y * cartesianPoint.y)),
            x: cartesianPoint.x,
            y: cartesianPoint.y,
            z: cartesianPoint.z
        };
    }
    /**
     * sumRadianDistance - calculates the sum of radian distance from
     * a given point to all points in an array
     */
    _sumRadianDistance(fromPoint, toPoints) {
        let result = 0;
        for (let toPoint of toPoints) {
            result += this.radianDistance(fromPoint, toPoint);
        }
        return result;
    }
    /**
     * testCandidateCenterPoints - For an array of potential new center of min distance
     * points, tests each, returning the best point or the existing point
     */
    _testCandidateCenterPoints(candidates, points, existingBest) {
        let result = {
            point: {
                lat: existingBest.point.lat,
                lng: existingBest.point.lng
            },
            avgDist: existingBest.avgDist,
            totalDist: existingBest.totalDist
        };
        for (let cp of candidates) {
            let dist = this._sumRadianDistance(cp, points);
            if (dist < result.totalDist) {
                result.point.lat = cp.lat;
                result.point.lng = cp.lng;
                result.totalDist = dist;
            }
        }
        return result;
    }
    /**
     * destinationPointRadians - Calculates the destination point in radians
     * from a starting point, bearing and distance (all in radians)
     */
    _destinationPointRadians(start, bearing, distance) {
        let lat = Math.asin(Math.sin(start.lat) * Math.cos(distance) +
            Math.cos(start.lat) * Math.sin(distance) * Math.cos(bearing));
        let lng = start.lng + Math.atan2(Math.sin(bearing) * Math.sin(distance) * Math.cos(start.lat), Math.cos(distance) - Math.sin(start.lat) * Math.sin(lat));
        // normalize lat / lng
        if (Math.abs(lat) > (Math.PI / 2)) {
            lat = Math.PI - lat - 2 * Math.PI * (lat < -Math.PI / 2 ? 1 : 0);
            lng = lng - Math.PI;
        }
        if (lng > Math.PI) {
            lng = lng - 2 * Math.PI;
        }
        else if (lng < -Math.PI) {
            lng = lng + 2 * Math.PI;
        }
        return { lat: lat, lng: lng };
    }
}
exports.default = PlasticGeoDistance;
//# sourceMappingURL=PlasticGeoDistance.js.map