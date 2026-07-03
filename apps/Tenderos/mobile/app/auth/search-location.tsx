import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Keyboard,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { buildGeocodeUrl } from "@/src/lib/mapbox";
import { searchStore, clearSearchStore } from "@/src/lib/search-store";
import Feather from "@expo/vector-icons/Feather";

type Suggestion = {
  id: string;
  name: string;
  subtitle: string;
  coordinates: [number, number]; // [lng, lat]
};

export default function SearchLocationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ── Manual keyboard tracking ──
  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) =>
      setKeyboardHeight(e.endCoordinates.height),
    );
    const hideSub = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardHeight(0),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // ── Mapbox Geocoding v6 (debounced 400ms) ──
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    try {
      const url = buildGeocodeUrl(query);
      const res = await fetch(url, { signal: abortRef.current.signal });
      const data = await res.json();

      if (data.features?.length > 0) {
        setSuggestions(
          data.features.map(
            (f: {
              id?: string;
              geometry: { coordinates: [number, number] };
              properties: { name: string; place_formatted: string };
            }) => ({
              id:
                f.id ??
                `${f.geometry.coordinates[0]}-${f.geometry.coordinates[1]}`,
              name: f.properties?.name ?? "",
              subtitle: f.properties?.place_formatted ?? "",
              coordinates: f.geometry.coordinates,
            }),
          ),
        );
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError("Error al buscar dirección");
    }
  }, []);

  const onSearchChange = (text: string) => {
    setSearch(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(text), 400);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  // ── Select result → save to store → go back to map ──
  const selectSuggestion = (suggestion: Suggestion) => {
    Keyboard.dismiss();
    const [lng, lat] = suggestion.coordinates;
    const address = `${suggestion.name}, ${suggestion.subtitle}`;
    searchStore.lat = lat;
    searchStore.lng = lng;
    searchStore.address = address;
    router.back();
  };

  const handleBack = () => {
    Keyboard.dismiss();
    clearSearchStore();
    router.back();
  };

  // ── Fade + slide animation ──
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <View className="flex-1 bg-white">
      <Animated.View
        className="flex-1"
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          paddingBottom: keyboardHeight,
        }}
      >
        {/* ── Content area (flex-1 pushes everything to the top) ── */}
        <View className="flex-1 px-6" style={{ paddingTop: insets.top + 24 }}>
          {/* ── Back Arrow ── */}
          <Pressable
            onPress={handleBack}
            className="mb-10 h-10 w-10 justify-center"
          >
            <FontAwesome6 name="chevron-left" size={24} color="black" />
          </Pressable>

          {/* ── Title ── */}
          <Text className="text-4xl pb-10 font-medium text-gray-900">
            Buscar dirección
          </Text>

          {/* ── Search input ── */}
          <View className="flex-row items-center rounded-xl border border-gray-900 bg-white px-4">
            <MaterialIcons name="search" size={22} color="#9ca3af" />
            <TextInput
              value={search}
              onChangeText={onSearchChange}
              placeholder="Escribí una dirección o lugar"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              className="ml-2 h-[52px] flex-1 text-lg text-gray-900"
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
            />
            {search.length > 0 && (
              <Pressable
                onPress={() => {
                  setSearch("");
                  setSuggestions([]);
                  setShowSuggestions(false);
                }}
              >
                <MaterialIcons name="close" size={20} color="#9ca3af" />
              </Pressable>
            )}
          </View>
        </View>

        {/* ── Results list ── */}
        <View className="flex-1 px-6 pt-4">
          {showSuggestions && suggestions.length > 0 ? (
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => selectSuggestion(item)}
                  className="flex-row items-center border-b border-gray-100 px-2 py-4"
                >
                  <Feather name="map-pin" size={18} color="#000" />
                  <View className="ml-3 flex-1">
                    <Text className="text-base text-gray-900">{item.name}</Text>
                    <Text className="text-sm text-gray-500">
                      {item.subtitle}
                    </Text>
                  </View>
                  <MaterialIcons
                    name="chevron-right"
                    size={24}
                    color="#9ca3af"
                  />
                </Pressable>
              )}
            />
          ) : search.trim().length >= 3 && !showSuggestions ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-base text-gray-400">
                Sin resultados. Probá con otro término.
              </Text>
            </View>
          ) : search.length === 0 ? (
            <View className="flex-1 items-center justify-center px-8">
              <MaterialIcons name="map" size={48} color="#d1d5db" />
              <Text className="mt-4 text-center text-base text-gray-400">
                Buscá una dirección o lugar para ubicar tu negocio.
              </Text>
            </View>
          ) : null}
        </View>

        {/* ── Bottom hint ── */}
        <View className="px-6" style={{ paddingBottom: insets.bottom + 16 }}>
          {error ? (
            <Text className="mb-3 text-sm text-red-500 text-center">
              {error}
            </Text>
          ) : null}
          <Text className="text-center pt-5 text-sm text-gray-400">
            <Feather name="map-pin" size={12} color="#6b7280" /> Seleccioná un
            resultado para verlo en el mapa
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}
