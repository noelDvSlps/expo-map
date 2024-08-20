import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  Button,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MapViewDirections from "react-native-maps-directions";
export default function App() {
  const window = Dimensions.get("window");
  const { width, height } = window;

  const [destination, setDestination] = useState({
    latitude: 14.40175,
    longitude: 120.85899,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const [mapRegion, setMapRegion] = useState({
    latitude: 14.40175,
    longitude: 120.85899,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const userLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setErrorMsg("Permission to access location was denied");
    }
    let location = await Location.getCurrentPositionAsync({
      enableHighAccuracy: true,
    });

    console.log(location.coords.latitude, location.coords.longitude);
    setMapRegion({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    });
    setDestination({
      latitude: location.coords.latitude + 0.007,
      longitude: location.coords.longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    });
  };

  useEffect(() => {
    userLocation();
  }, []);

  const handleDirectionsReady = (result) => {
    const distance = result.distance; // Distance (km)
    const duration = result.duration; // Travel time (hours)

    console.log(`Distance: ${distance} km, Travel time: ${duration} minutes`);
    // console.log(JSON.stringify(result));
  };

  const getLatLongDelta = (zoom, latitude) => {
    const LONGITUDE_DELTA = Math.exp(Math.log(360) - zoom * Math.LN2);
    const ONE_LATITUDE_DEGREE_IN_METERS = 111.32 * 1000;
    const accurateRegion =
      LONGITUDE_DELTA *
      (ONE_LATITUDE_DEGREE_IN_METERS * Math.cos(latitude * (Math.PI / 180)));
    const LATITUDE_DELTA = accurateRegion / ONE_LATITUDE_DEGREE_IN_METERS;

    return [LONGITUDE_DELTA, LATITUDE_DELTA];
  };

  const MIN_ZOOM_LEVEL = 3;
  const MAX_ZOOM_LEVEL = 20;

  const [zoom, setZoom] = useState(15);

  const handleZoom = (isZoomIn = false) => {
    let currentZoomLevel = zoom;
    // if zoomlevel set to max value and user click on minus icon, first decrement the level before checking threshold value
    if (!isZoomIn && currentZoomLevel === MAX_ZOOM_LEVEL) {
      currentZoomLevel -= 1;
    }
    // if zoomlevel set to min value and user click on plus icon, first increment the level before checking threshold value
    else if (isZoomIn && currentZoomLevel === MIN_ZOOM_LEVEL) {
      currentZoomLevel += 1;
    }
    if (
      currentZoomLevel >= MAX_ZOOM_LEVEL ||
      currentZoomLevel <= MIN_ZOOM_LEVEL
    ) {
      return;
    }

    currentZoomLevel = isZoomIn ? currentZoomLevel + 1 : currentZoomLevel - 1;
    const zoomedInRegion = {
      ...mapRegion,
      latitudeDelta: getLatLongDelta(currentZoomLevel, mapRegion.latitude)[1],
      longitudeDelta: getLatLongDelta(currentZoomLevel, mapRegion.latitude)[0],
    };

    setMapRegion(zoomedInRegion);
    setZoom(currentZoomLevel);
    mapRef?.current?.animateToRegion(zoomedInRegion, 100);
  };

  const mapRef = useRef(null);

  return (
    <View style={[styles.container, StyleSheet.absoluteFillObject]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={mapRegion}
        initialRegion={mapRegion}
        // onRegionChangeComplete={(region) => {
        //   setMapRegion(region);
        // }}
      >
        {/* <Marker coordinate={mapRegion} title="Marker" draggable={true} /> */}
        <Marker
          draggable
          pinColor="#0000ff"
          coordinate={{
            longitude: mapRegion.longitude,
            latitude: mapRegion.latitude,
          }}
          onDragEnd={(e) => {
            setMapRegion({
              ...e.nativeEvent.coordinate,
              latitudeDelta: mapRegion.latitudeDelta,
              longitudeDelta: mapRegion.longitudeDelta,
            });
          }}
        >
          <FontAwesome5 name="map-pin" size={36} color="black" />
        </Marker>
        <Marker
          draggable
          pinColor="#0000ff"
          coordinate={{
            longitude: destination.longitude,
            latitude: destination.latitude,
          }}
          onDragEnd={(e) => {
            setDestination({
              ...e.nativeEvent.coordinate,
              latitudeDelta: mapRegion.latitudeDelta,
              longitudeDelta: mapRegion.longitudeDelta,
            });
          }}
        >
          {/* <FontAwesome5 name="map-pin" size={36} color="black" /> */}
        </Marker>
        <MapViewDirections
          provider={PROVIDER_GOOGLE}
          origin={mapRegion}
          destination={destination}
          strokeWidth={4}
          strokeColor="red"
          apikey="AIzaSyCVNkpiSsTGuEcAd0GFhTdgnBZnJMmP9cU"
          onReady={handleDirectionsReady}
        />
      </MapView>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[styles.container, { backgroundColor: "yellow", flex: 0 }]}
      >
        <View
          style={{
            position: "absolute",
            marginHorizontal: 10,
            marginTop: 50,

            // height: "50%",
            width: "95%",
            // backgroundColor: "red",
          }}
        >
          <GooglePlacesAutocomplete
            fetchDetails={true}
            placeholder="Search"
            onPress={async (data, details = null) => {
              // 'details' is provided when fetchDetails = true
              // console.log(data, details);
              // console.log(details);
              console.log(JSON.stringify(details?.geometry?.location));
              setMapRegion({
                latitude: details?.geometry?.location.lat,
                longitude: details?.geometry?.location.lng,
                latitudeDelta: 0.0522,
                longitudeDelta: 0.0421,
              });
            }}
            onPlaceSelected={(place) => {
              console.log("Lat", place.geometry.location.lat());
              console.log("Lng", place.geometry.location.lng());
            }}
            query={{
              key: "AIzaSyCVNkpiSsTGuEcAd0GFhTdgnBZnJMmP9cU",
              language: "en",
            }}
            onFail={(error) => {
              console.log(error);
            }}
          />
        </View>
      </KeyboardAvoidingView>
      <View
        style={{
          position: "absolute",
          marginHorizontal: 10,
          bottom: 100,
          width: 50,
          backgroundColor: "red",
        }}
      >
        <TouchableOpacity>
          <Button
            disabled={zoom === MAX_ZOOM_LEVEL}
            title="+"
            name={"add"}
            size={22}
            onPress={() => handleZoom(true)}
          />
        </TouchableOpacity>

        <TouchableOpacity>
          <Button
            disabled={zoom === MIN_ZOOM_LEVEL}
            title="-"
            name={"add"}
            size={22}
            onPress={() => handleZoom()}
          />
        </TouchableOpacity>
      </View>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,

    // position: "relative",
    // backgroundColor: "#fff",
    // alignItems: "center",
    // justifyContent: "center",
  },
  map: {
    position: "absolute",
    zIndex: 20,
    height: "100%",
    width: "100%",
  },
});
