import { HereBase, HereMarker } from './here.common';

export { HereMarker, HereMapStyle } from './here.common';

export declare class Here extends HereBase {
  static init(appId: string, appCode: string, licenseKey: string): void;
  createNativeView(): Object;
  initNativeView(): void;
  disposeNativeView(): void;
  _getMarkersCount(): number;
  setCenter(lat: number, lon: number, animated: boolean): Promise<any>;
  addRoute(points: any): Promise<any>;
  addMarkers(markers: HereMarker[]): Promise<any>;
  removeMarkers(markers?: number[]): Promise<any>;
  updateMarkers(markers: HereMarker[]): Promise<any>;
  updateMarker(marker: HereMarker): Promise<any>;
}


