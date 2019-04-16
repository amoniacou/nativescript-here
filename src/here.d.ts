import { HereBase, HereMarker } from './here.common';
export declare class Here extends HereBase {
    private _layoutId;
    private fragment;
    private listener;
    private context;
    private FRAGMENT_ID;
    private isReady;
    private dragListener;
    private gestureListener;
    private nativeMarkers;
    private markersCallback;
    private markers;
    constructor();
    static init(appId: string, appCode: string, licenseKey: string): void;
    createNativeView(): Object;
    initNativeView(): void;
    disposeNativeView(): void;

    setCenter(lat: number, lon: number, animated: boolean): Promise<any>;

    // Markers
    addMarkers(markers: HereMarker[]): Promise<any>;
    removeMarkers(markers?: number[]): Promise<any>;
    updateMarkers(markers: HereMarker[]): Promise<any>;
    updateMarker(marker: HereMarker): Promise<any>;
    _getMarkersCount(): number;

    // Navigation
    _requestPremision(): Promise<any>;
    calculateRoute(points: object[]): Promise<any>;
    showWay(): Promise<any>;
    startNavigation(): Promise<any>;
    startSimulation(): Promise<any>;
    stopNavigation(): void;

    // Circles
    addCircle(circle): void;
}
