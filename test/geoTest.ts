/// <reference path="../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../node_modules/@types/chai/index.d.ts" />

import PlasticGeoDistance from "../PlasticGeoDistance";
import * as chai from "chai";

describe('PlasticGeoDistance', () => {
    let pgdM: PlasticGeoDistance;
    let pgdK: PlasticGeoDistance;

    const expect = chai.expect;

    const sampleLoc = {
        butte: { lat: 46.0038, lng: -112.5348 }, // Butte, Montana, USA
        billings: { lat: 45.7589, lng: -108.483 }, // Billings, Montana, USA
        bozeman: { lat: 45.6751, lng: -111.0428 }, // Bozeman, Montana, USA
        fiji: { lat: -17.7798, lng: 177.8037 }, // Fiji, South Pacific
        amsam: { lat: -14.2822, lng: -170.7314 }, // American Samoa
        mcmurdo: { lat: -77.8431, lng: 166.6879 }, // McMurdo Station, Antartic
        southnz: { lat: -45.7854, lng: 168.5981 } // Southern New Zealand, random pt near Lumsden
    };

    const reallyClose = (a: number, b: number, closeness?: number): boolean => {
        const clsns: number = closeness && closeness > 0 ? closeness : 0.0005;
        return Math.abs(1 - (b != 0 ? a / b : (a + 1) / (b + 1))) < clsns;
    }

    beforeEach(function () {
        pgdM = new PlasticGeoDistance('M');
        pgdK = new PlasticGeoDistance('K');
    });

    describe('Conversions', () => {
        it('Should convert lat/lng to/from radians', () => {
            let result: Ilatlng = pgdM.geoToDegrees(pgdM.geoToRadians({ lat: 36.12547, lng: -115.07517 }));
            expect(result.lat).to.be.eql(36.12547);
            expect(result.lng).to.be.eql(-115.07517);
        });
        it('should produce the equiv distance in miles and kilometers', () => {
            let m = pgdM.distance(sampleLoc.butte, sampleLoc.billings);
            let k = pgdK.distance(sampleLoc.butte, sampleLoc.billings);
            expect(reallyClose(m * 1.60934, k)).to.be.eql(true);
            m = pgdM.distance(sampleLoc.butte, sampleLoc.mcmurdo);
            k = pgdK.distance(sampleLoc.butte, sampleLoc.mcmurdo);
            expect(reallyClose(m * 1.60934, k)).to.be.eql(true);
        });
    });
    describe('Distance', () => {
        it('should calculate a correct distance between points', () => {
            const kDist = pgdK.distance(sampleLoc.butte, sampleLoc.southnz);
            expect(reallyClose(kDist, 12783)).to.be.eql(true);
        });
        it('should calculate a correct distance between points (2)', () => {
            const kDist = pgdK.distance(sampleLoc.fiji, sampleLoc.southnz);
            expect(reallyClose(kDist, 3228)).to.be.eql(true);
        });
    });
    describe('Bounds', () => {
        it('should create a bounding rectangle', () => {
            let bounds = pgdM.bounds(100, sampleLoc.butte);
            expect(bounds).to.haveOwnProperty('maxLat');
            expect(bounds).to.haveOwnProperty('maxLng');
            expect(bounds).to.haveOwnProperty('minLat');
            expect(bounds).to.haveOwnProperty('minLng');
            expect(bounds.maxLat).to.be.greaterThan(sampleLoc.butte.lat);
            expect(bounds.minLat).to.be.lessThan(sampleLoc.butte.lat);
        });
        it('should check if a point is within bounding rectangle', () => {
            let bc = pgdM.getBoundsCheckFunction(100, sampleLoc.butte);
            expect(bc(sampleLoc.bozeman)).to.be.eql(true);
            expect(bc(sampleLoc.billings)).to.be.eql(false);
            bc = pgdM.getBoundsCheckFunction(2500, sampleLoc.southnz);
            expect(bc(sampleLoc.mcmurdo)).to.be.eql(true);
            expect(pgdM.isInBounds({ lat: -90, lng: 0 }, pgdM.bounds(850, sampleLoc.mcmurdo))).to.be.eql(true);
            expect(pgdM.isInBounds({ lat: -90, lng: 0 }, pgdM.bounds(830, sampleLoc.mcmurdo))).to.be.eql(false);
        });
    });
    describe('Geographic Center', () => {
        it('should find the center of two points', () => {
            let center = pgdM.computeMidpoint([{ lat: 0, lng: 15 }, { lat: 0, lng: 35 }]);
            expect(reallyClose(center.lat, 0)).to.be.eql(true);
            expect(reallyClose(center.lng, 25)).to.be.eql(true);
            center = pgdM.computeMidpoint([{ lat: 10, lng: 15 }, { lat: -10, lng: 15 }]);
            expect(reallyClose(center.lat, 0)).to.be.eql(true);
            expect(reallyClose(center.lng, 15)).to.be.eql(true);
        });
        it('should be the inverse of bounding rectangle for small dist mid lat', () => {
            let bounds = pgdM.bounds(100, sampleLoc.butte);
            let center = pgdM.computeMidpoint([
                { lat: bounds.maxLat, lng: bounds.maxLng },
                { lat: bounds.maxLat, lng: bounds.minLng },
                { lat: bounds.minLat, lng: bounds.maxLng },
                { lat: bounds.minLat, lng: bounds.minLng }
            ]);
            expect(reallyClose(center.lat, sampleLoc.butte.lat)).to.be.eql(true);
            expect(reallyClose(center.lng, sampleLoc.butte.lng)).to.be.eql(true);
        });
        it('should calculate correct center for 7 points', () => {
            const correct : Ilatlng = { lat:-1.360479,lng: -151.884239};
            let center = pgdM.computeMidpoint([
                sampleLoc.billings,
                sampleLoc.bozeman,
                sampleLoc.butte,
                sampleLoc.amsam,
                sampleLoc.fiji,
                sampleLoc.mcmurdo,
                sampleLoc.southnz
            ]);
            expect(reallyClose(center.lat, correct.lat)).to.be.eql(true);
            expect(reallyClose(center.lng, correct.lng)).to.be.eql(true);
        })
    });
    describe('Center of distance', () => {
        it('should be at least as close as the center of a bounding rectangle', () => {
            let correct: Ilatlng = { lat: 46.089779, lng: -112.5348 };
            let bounds = pgdM.bounds(123, sampleLoc.butte);
            const points: Array<Ilatlng> = [
                { lat: bounds.maxLat, lng: bounds.maxLng },
                { lat: bounds.maxLat, lng: bounds.minLng },
                { lat: bounds.minLat, lng: bounds.maxLng },
                { lat: bounds.minLat, lng: bounds.minLng }
            ];
            let center = pgdM.computeMinimumDistancePoint(points);
            let tdist: number = 0;
            points.forEach((p) => {
                tdist += pgdM.distance(p, sampleLoc.butte);
            });
            expect(reallyClose(center.point.lat, correct.lat)).to.be.eql(true);
            expect(reallyClose(center.point.lng, correct.lng)).to.be.eql(true);
            expect(pgdM.distance(center.point, correct)).to.be.lessThan(0.1);
            expect(tdist).to.be.greaterThan(center.totalDist);
        });
        it('should calculate correct center for three points', () => {
            const correct: Ilatlng = { lat: 45.6751, lng: -111.0428 };
            let center = pgdM.computeMinimumDistancePoint([
                sampleLoc.billings,
                sampleLoc.bozeman,
                sampleLoc.butte
            ]);
            expect(reallyClose(center.point.lat, correct.lat)).to.be.eql(true);
            expect(reallyClose(center.point.lng, correct.lng)).to.be.eql(true);
            expect(pgdM.distance(center.point, correct)).to.be.lessThan(0.1);
        });
        it('should calculate correct center for 7 points', () => {
            const correct: Ilatlng = { lat: -14.282199, lng: -170.731399 };
            let center = pgdM.computeMinimumDistancePoint([
                sampleLoc.billings,
                sampleLoc.bozeman,
                sampleLoc.butte,
                sampleLoc.amsam,
                sampleLoc.fiji,
                sampleLoc.mcmurdo,
                sampleLoc.southnz
            ]);
            expect(reallyClose(center.point.lat, correct.lat)).to.be.eql(true);
            expect(reallyClose(center.point.lng, correct.lng)).to.be.eql(true);
            expect(pgdM.distance(center.point, correct)).to.be.lessThan(0.1);
        });
    });
});