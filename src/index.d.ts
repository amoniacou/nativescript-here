import { HereBase, HereMarker } from './here.common';

export { HereMarker, HereMapStyle } from './here.common';

export declare class Here extends HereBase {
  static init(appId: string, appCode: string, licenseKey: string): void;
  createNativeView(): Object;
  initNativeView(): void;
  disposeNativeView(): void;

  setCenter(lat: number, lon: number, animated: boolean): Promise<any>;

  // Markers
  addMarkers(markers: HereMarker[]): Promise<any>;
  addMarker(marker: HereMarker): void;
  removeMarkers(markers?: number[]): Promise<any>;
  clearMarkers(): void;
  updateMarkers(markers: HereMarker[]): Promise<any>;
  updateMarker(marker: HereMarker): Promise<any>;
  _getMarkersCount(): number;

  // Navigation
  calculateRoute(points: object[]): Promise<any>;
  showWay(): Promise<any>;
  startNavigation(): Promise<any>;
  pauseNavigation(): Promise<any>;
  resumeNavigation(): Promise<any>;
  startSimulation(): Promise<any>;
  stopNavigation(): void;
  setNavigationMode(mode: string): Promise<any>;
  getCurrentPosition(): Promise<any>;
  navigateTo(latitude: number, longitude: number): Promise<any>;
  removeNavigation(): void;

  // Circles
  addCircle(circle): void;
}


