"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var view_1 = require("tns-core-modules/ui/core/view");
var HereBase = (function (_super) {
    __extends(HereBase, _super);
    function HereBase() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    HereBase.mapReadyEvent = 'mapReady';
    HereBase.mapClickEvent = 'mapClick';
    HereBase.mapLongClickEvent = 'mapLongClick';
    HereBase.geoPositionChange = 'geoPositionChange';
    return HereBase;
}(view_1.View));
exports.HereBase = HereBase;
var HereMapStyle;
(function (HereMapStyle) {
    HereMapStyle["NORMAL_DAY"] = "normal_day";
    HereMapStyle["SATELLITE_DAY"] = "satellite_day";
    HereMapStyle["HYBRID_DAY"] = "hybrid_day";
    HereMapStyle["TERRAIN_DAY"] = "terrain_day";
})(HereMapStyle = exports.HereMapStyle || (exports.HereMapStyle = {}));
var booleanConverter = function (v) {
    return String(v) === 'true';
};
exports.landmarksProperty = new view_1.Property({
    name: 'landmarks',
    defaultValue: false,
    valueConverter: function (v) { return booleanConverter(v); }
});
exports.landmarksProperty.register(HereBase);
exports.tiltProperty = new view_1.Property({
    name: 'tilt',
    defaultValue: 0,
    valueConverter: function (v) { return +v; }
});
exports.tiltProperty.register(HereBase);
exports.zoomLevelProperty = new view_1.Property({
    name: 'zoomLevel',
    defaultValue: 0,
    valueConverter: function (v) { return +v; }
});
exports.zoomLevelProperty.register(HereBase);
exports.mapStyleProperty = new view_1.Property({
    name: 'mapStyle',
    defaultValue: HereMapStyle.NORMAL_DAY
});
exports.mapStyleProperty.register(HereBase);
exports.latitudeProperty = new view_1.Property({
    name: 'latitude'
});
exports.latitudeProperty.register(HereBase);
exports.longitudeProperty = new view_1.Property({
    name: 'longitude'
});
exports.longitudeProperty.register(HereBase);
exports.disableZoomProperty = new view_1.Property({
    name: 'disableZoom',
    defaultValue: false,
    valueConverter: function (v) { return booleanConverter(v); }
});
exports.disableZoomProperty.register(HereBase);
exports.disableScrollProperty = new view_1.Property({
    name: 'disableScroll',
    defaultValue: false,
    valueConverter: function (v) { return booleanConverter(v); }
});
exports.disableScrollProperty.register(HereBase);
//# sourceMappingURL=here.common.js.map