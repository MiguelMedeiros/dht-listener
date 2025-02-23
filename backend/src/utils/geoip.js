import geoip from 'geoip-lite';

export function trackNodeLocations(ip) {
    const geo = geoip.lookup(ip);
    if (geo) {
        return {
            city: geo.city,
            country: geo.country,
            region: geo.region,
            ll: geo.ll // longitude and latitude
        };
    }
    return null;
} 