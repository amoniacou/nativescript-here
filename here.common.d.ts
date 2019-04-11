import { Property, View } from 'tns-core-modules/ui/core/view';
export declare abstract class HereBase extends View {
    mapStyle: HereMapStyle;
    latitude: number;
    longitude: number;
    disableZoom: boolean;
    disableScroll: boolean;
    zoomLevel: number;
    tilt: number;
    landmarks: boolean;
    static mapReadyEvent: string;
    static mapClickEvent: string;
    static mapLongClickEvent: string;
    static geoPositionChange: string;
    abstract setCenter(lat: number, lon: number, animated: boolean): Promise<any>;
    abstract addMarkers(markers: HereMarker[]): Promise<any>;
    abstract removeMarkers(markers?: number[]): Promise<any>;
    abstract updateMarkers(markers: HereMarker[]): Promise<any>;
    abstract updateMarker(marker: HereMarker): Promise<any>;
    abstract _getMarkersCount(): number;
    abstract _requestPremision(): Promise<any>;
    abstract calculateRoute(points: object[]): Promise<any>;
    abstract showWay(): Promise<any>;
    abstract startNavigation(): Promise<any>;
    abstract stopNavigation(): Promise<any>;
    abstract toNextWaypoint(): void;
    abstract toPrevWaypoint(): void;
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
export declare enum HereMapStyle {
    NORMAL_DAY = "normal_day",
    SATELLITE_DAY = "satellite_day",
    HYBRID_DAY = "hybrid_day",
    TERRAIN_DAY = "terrain_day"
}
export declare const landmarksProperty: Property<HereBase, boolean>;
export declare const tiltProperty: Property<HereBase, number>;
export declare const zoomLevelProperty: Property<HereBase, number>;
export declare const mapStyleProperty: Property<HereBase, HereMapStyle>;
export declare const latitudeProperty: Property<HereBase, number>;
export declare const longitudeProperty: Property<HereBase, number>;
export declare const disableZoomProperty: Property<HereBase, boolean>;
export declare const disableScrollProperty: Property<HereBase, boolean>;
