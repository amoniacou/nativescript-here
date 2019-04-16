import { Property, View } from 'tns-core-modules/ui/core/view';

export abstract class HereBase extends View {
    mapStyle: HereMapStyle;
    latitude: number;
    longitude: number;
    disableZoom: boolean;
    disableScroll: boolean;
    zoomLevel: number;
    tilt: number;
    landmarks: boolean;

    static mapInitializedEvent: string = 'mapInitialized';
    static mapReadyEvent: string = 'mapReady';
    static mapClickEvent: string = 'mapClick';
    static mapLongClickEvent: string = 'mapLongClick';
    static geoPositionChange: string = 'geoPositionChange';
    abstract setCenter(lat: number, lon: number, animated: boolean): Promise<any>;

    // Markers
    abstract addMarkers(markers: HereMarker[]): Promise<any>;
    abstract removeMarkers(markers?: number[]): Promise<any>;
    abstract updateMarkers(markers: HereMarker[]): Promise<any>;
    abstract updateMarker(marker: HereMarker): Promise<any>;
    abstract _getMarkersCount(): number;

    // Navigation
    abstract _requestPremision(): Promise<any>;
    abstract calculateRoute(points: object[]): Promise<any>;
    abstract showWay(): Promise<any>;
    abstract startNavigation(): Promise<any>;
    abstract startSimulation(): Promise<any>;
    abstract stopNavigation(): void;

    // Circles
    abstract addCircle(circle): void;
}

export interface HereMarker {
    id: number;
    latitude: number;
    longitude: number;
    title?: string;
    description?: string;
    draggable?: boolean;
    selected?: boolean;
    onTap?: Function;
    icon?: string;
}

export enum HereMapStyle {
    NORMAL_DAY = 'normal_day',
    SATELLITE_DAY = 'satellite_day',
    HYBRID_DAY = 'hybrid_day',
    TERRAIN_DAY = 'terrain_day'
}

const booleanConverter = (v: any): boolean => {
    return String(v) === 'true';
};

export const landmarksProperty = new Property<HereBase, boolean>({
    name: 'landmarks',
    defaultValue: false,
    valueConverter: v => booleanConverter(v)
});

landmarksProperty.register(HereBase);

export const tiltProperty = new Property<HereBase, number>({
    name: 'tilt',
    defaultValue: 0,
    valueConverter: v => +v
});

tiltProperty.register(HereBase);

export const zoomLevelProperty = new Property<HereBase, number>({
    name: 'zoomLevel',
    defaultValue: 0,
    valueConverter: v => +v
});

zoomLevelProperty.register(HereBase);

export const mapStyleProperty = new Property<HereBase, HereMapStyle>({
    name: 'mapStyle',
    defaultValue: HereMapStyle.NORMAL_DAY
});

mapStyleProperty.register(HereBase);

export const latitudeProperty = new Property<HereBase, number>({
    name: 'latitude'
});

latitudeProperty.register(HereBase);

export const longitudeProperty = new Property<HereBase, number>({
    name: 'longitude'
});

longitudeProperty.register(HereBase);

export const disableZoomProperty = new Property<HereBase, boolean>({
    name: 'disableZoom',
    defaultValue: false,
    valueConverter: v => booleanConverter(v)
});

disableZoomProperty.register(HereBase);

/*
export const disableRotationProperty = new Property<HereBase, boolean>({
    name: 'disableRotation',
    defaultValue: false,
    valueConverter: v => booleanConverter(v)
});


disableRotationProperty.register(HereBase);
*/

export const disableScrollProperty = new Property<HereBase, boolean>({
    name: 'disableScroll',
    defaultValue: false,
    valueConverter: v => booleanConverter(v)
});

disableScrollProperty.register(HereBase);

/*
export const disableTiltProperty = new Property<HereBase, boolean>({
    name: 'disableTilt',
    defaultValue: false,
    valueConverter: v => booleanConverter(v)
});

disableTiltProperty.register(HereBase);

*/