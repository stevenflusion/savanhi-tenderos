import Feather from "@expo/vector-icons/Feather";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Keyboard,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Mapbox from "@rnmapbox/maps";
import {
  authLocationSearchState,
  clearAuthLocationSearchState,
  useAuth,
} from "@/src/features/auth";
import { MAPBOX_ACCESS_TOKEN } from "@/src/lib/mapbox";
import authLogo from "../assets/auth-logo";
import StepHeader from "../components/StepHeader";

if (MAPBOX_ACCESS_TOKEN) {
  Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);
} else {
  console.warn(
    "MAPBOX_ACCESS_TOKEN is empty — map tiles will not load. Check .env and app.config.js",
  );
}

const DEFAULT_LNG = -78.52495;
const DEFAULT_LAT = -0.22985;
const SHEET_ANIM_DURATION = 300;
const DISMISS_THRESHOLD = 120;

export default function BusinessLocationScreen() {
  const { saveLocation } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<Mapbox.Camera>(null);

  const [selectedAddress, setSelectedAddress] = useState("");
  const [latitude, setLatitude] = useState(DEFAULT_LAT);
  const [longitude, setLongitude] = useState(DEFAULT_LNG);
  const [loading, setLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(true);
  const [gpsError, setGpsError] = useState("");
  const [showAddressSheet, setShowAddressSheet] = useState(false);

  const sheetAnimY = useRef(new Animated.Value(0)).current;
  const sheetVisibleRef = useRef(false);

  useEffect(() => {
    if (showAddressSheet) {
      sheetVisibleRef.current = true;
      sheetAnimY.setValue(0);
    }
  }, [showAddressSheet, sheetAnimY]);

  const dismissSheet = useCallback(() => {
    return new Promise<void>((resolve) => {
      Animated.timing(sheetAnimY, {
        toValue: 400,
        duration: SHEET_ANIM_DURATION,
        useNativeDriver: true,
      }).start(() => {
        sheetVisibleRef.current = false;
        setShowAddressSheet(false);
        resolve();
      });
    });
  }, [sheetAnimY]);

  const sheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 5,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) sheetAnimY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > DISMISS_THRESHOLD || gs.vy > 0.5) {
          dismissSheet();
        } else {
          Animated.spring(sheetAnimY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 20,
            stiffness: 200,
          }).start();
        }
      },
    }),
  ).current;

  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string> => {
    try {
      const revGeo = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });
      if (revGeo.length > 0 && revGeo[0]) {
        const addr = revGeo[0];
        const parts = [
          addr.street,
          addr.streetNumber,
          addr.city,
          addr.region,
        ].filter((s): s is string => !!s);
        return parts.join(", ");
      }
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch {
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (authLocationSearchState.lat && authLocationSearchState.lng) {
        const { lat, lng, address } = authLocationSearchState;
        clearAuthLocationSearchState();
        setLatitude(lat);
        setLongitude(lng);
        setSelectedAddress(address);
        setIsLocating(false);
        cameraRef.current?.flyTo([lng, lat], 1000);
        setTimeout(() => setShowAddressSheet(true), 600);
      }
    }, []),
  );

  useEffect(() => {
    let cancelled = false;

    const initLocation = async () => {
      setIsLocating(true);
      setGpsError("");
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;

        const { latitude: lat, longitude: lng } = loc.coords;
        setLatitude(lat);
        setLongitude(lng);
        const address = await reverseGeocode(lat, lng);
        if (cancelled) return;
        setSelectedAddress(address);
        cameraRef.current?.flyTo([lng, lat], 1000);
      } catch {
        if (!cancelled) {
          setGpsError(
            "No pudimos obtener tu ubicación. Mové el pin para indicar tu dirección.",
          );
        }
      } finally {
        if (!cancelled) setIsLocating(false);
      }
    };

    initLocation();

    return () => {
      cancelled = true;
    };
  }, [reverseGeocode]);

  const [showFabOptions, setShowFabOptions] = useState(false);
  const [fabOptionsRendered, setFabOptionsRendered] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const fabAnim = useRef(new Animated.Value(0)).current;
  const fabRotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showFabOptions) {
      setFabOptionsRendered(true);
      fabAnim.setValue(0);
      fabRotateAnim.setValue(0);
      Animated.parallel([
        Animated.timing(fabAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fabRotateAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fabAnim, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fabRotateAnim, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => setFabOptionsRendered(false));
    }
  }, [showFabOptions, fabAnim, fabRotateAnim]);

  const handleGetCurrentLocation = async () => {
    setGpsLoading(true);
    setGpsError("");
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude: lat, longitude: lng } = loc.coords;
      setLatitude(lat);
      setLongitude(lng);
      const address = await reverseGeocode(lat, lng);
      setSelectedAddress(address);
      cameraRef.current?.flyTo([lng, lat], 1000);
    } catch {
      setGpsError(
        "No pudimos obtener tu ubicación. Mové el pin para indicar tu dirección.",
      );
    } finally {
      setGpsLoading(false);
    }
  };

  const onDragEnd = async (feature: any) => {
    const [lng, lat] = feature.geometry.coordinates;
    setLatitude(lat);
    setLongitude(lng);
    const address = await reverseGeocode(lat, lng);
    setSelectedAddress(address);
    setShowAddressSheet(true);
  };

  const handleConfirm = async () => {
    if (loading || !selectedAddress) return;
    await dismissSheet();
    setLoading(true);
    const result = await saveLocation({
      address: selectedAddress,
      latitude,
      longitude,
    });
    if (result.success) {
      cameraRef.current?.flyTo([longitude, latitude], 500);
      router.push("/auth/store-photos" as any);
      setTimeout(() => setLoading(false), 400);
    } else {
      setLoading(false);
    }
  };

  const handleBack = () => {
    Keyboard.dismiss();
    setTimeout(() => router.back(), 50);
  };

  const hasAddress = selectedAddress.length > 0;

  return (
    <View className="flex-1 bg-gray-200">
      <Mapbox.MapView
        style={StyleSheet.absoluteFill}
        styleURL="mapbox://styles/mapbox/streets-v12"
        scaleBarEnabled={false}
        logoEnabled={false}
        attributionEnabled={false}
      >
        <Mapbox.Camera
          ref={cameraRef}
          centerCoordinate={[longitude, latitude]}
          zoomLevel={15}
          animationMode="moveTo"
          animationDuration={0}
        />
        <Mapbox.PointAnnotation
          key={`pin-${latitude}-${longitude}`}
          id="business-pin"
          coordinate={[longitude, latitude]}
          draggable
          onDragEnd={onDragEnd}
          title="Tu negocio"
          subtitle={selectedAddress || "Arrastra para ajustar"}
        />
      </Mapbox.MapView>

      <View className="flex-1">
        <View style={{ paddingTop: insets.top + 16 }} className="px-6">
          <StepHeader current={3} total={4} onBack={handleBack} />
        </View>
        <View className="flex-1" />

        {gpsError && !isLocating ? (
          <View className="mx-6 mb-2 rounded-lg bg-white/80 px-3 py-2">
            <Text className="text-center text-sm text-gray-500">{gpsError}</Text>
          </View>
        ) : null}

        <View className="px-6" style={{ paddingBottom: insets.bottom + 16 }}>
          <Pressable
            onPress={async () => {
              if (!hasAddress || loading || isLocating) return;
              setLoading(true);
              const result = await saveLocation({
                address: selectedAddress,
                latitude,
                longitude,
              });
              if (result.success) {
                router.push("/auth/store-photos" as any);
                setTimeout(() => setLoading(false), 400);
              } else {
                setLoading(false);
              }
            }}
            disabled={!hasAddress || loading || isLocating}
            className={`h-16 flex-row items-center justify-center gap-2 rounded-full ${
              hasAddress && !loading && !isLocating ? "bg-black" : "bg-gray-300"
            }`}
          >
            <Text className="text-lg text-white">
              {isLocating ? "Obteniendo ubicación..." : "Confirmar ubicación"}
            </Text>
          </Pressable>
        </View>
      </View>

      {!isLocating && (
        <View className="absolute bottom-28 right-6 z-30 items-end">
          {fabOptionsRendered && (
            <Animated.View
              className="mb-2 items-end gap-2"
              style={{
                opacity: fabAnim,
                transform: [
                  {
                    scale: fabAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  },
                ],
              }}
            >
              <Animated.View
                style={{
                  transform: [
                    {
                      translateY: fabAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                  ],
                }}
              >
                <Pressable
                  onPress={() => {
                    setShowFabOptions(false);
                    router.push("/auth/search-location" as any);
                  }}
                  className="h-11 flex-row items-center gap-2 rounded-full border border-gray-200 bg-white pl-3 pr-4"
                >
                  <Feather name="search" size={18} color="#6b7280" />
                  <Text className="text-sm text-gray-700">Buscar</Text>
                </Pressable>
              </Animated.View>

              <Animated.View
                style={{
                  transform: [
                    {
                      translateY: fabAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [40, 0],
                      }),
                    },
                  ],
                }}
              >
                <Pressable
                  onPress={handleGetCurrentLocation}
                  disabled={gpsLoading}
                  className="h-11 flex-row items-center gap-2 rounded-full border border-gray-200 bg-white pl-3 pr-4"
                >
                  {gpsLoading ? (
                    <ActivityIndicator size={16} color="#6b7280" />
                  ) : (
                    <Feather name="map-pin" size={16} color="#6b7280" />
                  )}
                  <Text className="text-sm text-gray-700">
                    {gpsLoading ? "Obteniendo..." : "Mi ubicación"}
                  </Text>
                </Pressable>
              </Animated.View>
            </Animated.View>
          )}

          <Pressable
            onPress={() => setShowFabOptions((prev) => !prev)}
            className="h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg"
            style={{
              elevation: 6,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
            }}
          >
            <Animated.View
              style={{
                transform: [
                  {
                    rotate: fabRotateAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0deg", "45deg"],
                    }),
                  },
                ],
              }}
            >
              <Feather name="plus" size={24} color="#6b7280" />
            </Animated.View>
          </Pressable>
        </View>
      )}

      {showAddressSheet && (
        <View className="absolute inset-0 z-40">
          <Pressable className="flex-1 bg-black/40" onPress={dismissSheet} />
          <Animated.View
            style={{ transform: [{ translateY: sheetAnimY }] }}
            className="rounded-t-3xl bg-white px-6 pb-10 pt-2"
            {...sheetPanResponder.panHandlers}
          >
            <View className="mb-6 self-center h-1 w-12 rounded-full bg-gray-400" />
            <View className="items-center mb-4">
              <MaterialIcons name="location-on" size={44} color="black" />
            </View>
            <Text className="text-3xl mb-2 text-center font-medium text-gray-900">
              Ubicación del negocio
            </Text>
            <Text className="text-base mb-6 text-center leading-5 text-gray-600">
              {selectedAddress}
            </Text>
            <Pressable
              onPress={handleConfirm}
              disabled={loading}
              className="h-16 items-center justify-center rounded-full bg-black"
            >
              <Text className="text-lg font-medium text-white">
                {loading ? "Guardando..." : "Confirmar ubicación"}
              </Text>
            </Pressable>
            <Text className="text-center flex items-center justify-center text-sm pt-4">
              <MaterialIcons name="lock" size={12} color="black" /> Esta
              información ayuda a personalizar tu sesión
            </Text>
          </Animated.View>
        </View>
      )}

      {loading && (
        <View className="absolute inset-0 z-50">
          <View className="flex-1 items-center justify-center bg-white">
            <Image source={authLogo} className="h-40 w-40" resizeMode="contain" />
          </View>
        </View>
      )}
    </View>
  );
}
