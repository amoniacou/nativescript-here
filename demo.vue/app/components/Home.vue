<template>
    <Page class="page">
        <ActionBar class="action-bar">
            <Label class="action-bar-title" text="HERE MAPS"></Label>
        </ActionBar>

        <GridLayout>
            <HereMap 
                @mapReady="onMapReady"
                row="3" 
                id="map" 
                zoomLevel="15"  
                disableZoom="false" 
                disableScroll="false" 
                :latitude="latitude" 
                :longitude="longitude" 
                tilt="45" />
        </GridLayout>
    </Page>
</template>

<script>
    export default {
        data() {
            return {
                latitude: 49.1966286,
                longitude: -123.0053635,

                points: [
                    {
                        latitude: 59.435803,
                        longitude: 24.757259
                    }, {
                        latitude: 59.433808,
                        longitude: 24.766438
                    }, {
                        latitude: 59.438599,
                        longitude: 24.791812
                    }
                ],

                map: null
            }
        },

        computed: {
            firstPoint() {
                return this.points[0]
            }
        },

        methods: {
            onMapReady(args) {
                this.map = args.object
                
                this.toStart()
                // this.map
                //     .addRoute(this.points)
                //     .then(() => {
                //         this.toStart()
                //         this.map.addMarkers(this.points.map((point, index) => ({
                //             ...point,
                //             id: index,
                //             title: `Point ${ index + 1 }`,
                //             description: null,
                //             draggable: false,
                //             selected: !index,
                //             onTap: (marker) => {
                //                 const updatedMarker = Object.assign({}, marker, {
                //                     selected: !marker.selected
                //                 });
                //                 this.map.updateMarker(updatedMarker);
                //             }
                //         })))
                //     })
            },

            toStart() {
                this.map.setCenter(this.firstPoint.latitude, this.firstPoint.longitude, true)
            }
        }
    };
</script>

<style scoped lang="scss">
    // Start custom common variables
    @import '../app-variables';
    // End custom common variables

    // Custom styles

</style>
