import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";

type Tab = "home" | "wardrobe" | "dressing" | "looks";
type Category = "Tops" | "Bottoms" | "Dresses" | "Shoes" | "Bags" | "Accessories";

type Item = {
  id: string;
  category: Category;
  uri?: string;
  label: string;
  color: string;
};

type Look = {
  id: string;
  name: string;
  top?: string;
  bottom?: string;
  shoes?: string;
};

const STORAGE_KEY = "wardrobe-v0.1-phone";

const palette = {
  bg: "#F6F1EB",
  paper: "#FFFDFC",
  ink: "#1E1C1A",
  muted: "#7B746D",
  line: "#E6DED6",
  accent: "#D9B7A7",
  chip: "#EEE5DD",
};

const demoItems: Item[] = [
  { id: "t1", category: "Tops", label: "Ivory knit", color: "#E9DED0" },
  { id: "t2", category: "Tops", label: "Black tee", color: "#2E2B29" },
  { id: "b1", category: "Bottoms", label: "Blue jeans", color: "#8EA3B4" },
  { id: "b2", category: "Bottoms", label: "Cream skirt", color: "#DCCDBA" },
  { id: "s1", category: "Shoes", label: "Sneakers", color: "#D8D4CE" },
  { id: "s2", category: "Shoes", label: "Black boots", color: "#3D3834" },
];

const categories: Category[] = ["Tops", "Bottoms", "Dresses", "Shoes", "Bags", "Accessories"];

function nextId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function App() {
  const [tab, setTab] = useState<Tab>("home");
  const [items, setItems] = useState<Item[]>(demoItems);
  const [looks, setLooks] = useState<Look[]>([]);
  const [selectedTop, setSelectedTop] = useState("t1");
  const [selectedBottom, setSelectedBottom] = useState("b1");
  const [selectedShoes, setSelectedShoes] = useState("s1");
  const [filter, setFilter] = useState<Category>("Tops");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          const state = JSON.parse(raw);
          if (Array.isArray(state.items)) setItems(state.items);
          if (Array.isArray(state.looks)) setLooks(state.looks);
          if (state.selectedTop) setSelectedTop(state.selectedTop);
          if (state.selectedBottom) setSelectedBottom(state.selectedBottom);
          if (state.selectedShoes) setSelectedShoes(state.selectedShoes);
        } catch {}
      }
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ items, looks, selectedTop, selectedBottom, selectedShoes })
    );
  }, [hydrated, items, looks, selectedTop, selectedBottom, selectedShoes]);

  const top = items.find((x) => x.id === selectedTop);
  const bottom = items.find((x) => x.id === selectedBottom);
  const shoes = items.find((x) => x.id === selectedShoes);

  const filteredItems = useMemo(
    () => items.filter((x) => x.category === filter),
    [items, filter]
  );

  const cycle = (category: Category, currentId: string | undefined, dir: number) => {
    const list = items.filter((x) => x.category === category);
    if (!list.length) return undefined;
    const idx = Math.max(0, list.findIndex((x) => x.id === currentId));
    return list[(idx + dir + list.length) % list.length].id;
  };

  const addItem = async () => {
    const choice = await new Promise<"camera" | "library" | null>((resolve) => {
      Alert.alert("Add item", "Fotografa un capo isolato o scegli una foto.", [
        { text: "Camera", onPress: () => resolve("camera") },
        { text: "Gallery", onPress: () => resolve("library") },
        { text: "Cancel", style: "cancel", onPress: () => resolve(null) },
      ]);
    });
    if (!choice) return;

    if (choice === "camera") {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permesso richiesto", "Consenti l'accesso alla fotocamera.");
        return;
      }
    }

    const result =
      choice === "camera"
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [3, 4],
            quality: 0.9,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [3, 4],
            quality: 0.9,
          });

    if (result.canceled) return;

    const uri = result.assets[0]?.uri;
    if (!uri) return;

    const category = filter;
    setItems((old) => [
      ...old,
      {
        id: nextId(),
        category,
        uri,
        label: `My ${category.slice(0, -1) || category}`,
        color: "#E7DDD4",
      },
    ]);
  };

  const saveLook = () => {
    const look: Look = {
      id: nextId(),
      name: `Look ${looks.length + 1}`,
      top: selectedTop,
      bottom: selectedBottom,
      shoes: selectedShoes,
    };
    setLooks((old) => [look, ...old]);
    Alert.alert("Saved", "Look salvato.");
  };

  const loadLook = (look: Look) => {
    if (look.top) setSelectedTop(look.top);
    if (look.bottom) setSelectedBottom(look.bottom);
    if (look.shoes) setSelectedShoes(look.shoes);
    setTab("dressing");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.shell}>
        {tab === "home" && (
          <ScrollView contentContainerStyle={styles.screen}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.eyebrow}>WARDROBE</Text>
                <Text style={styles.title}>Good morning, Bea</Text>
                <Text style={styles.subtitle}>Your closet, ready to play.</Text>
              </View>
              <View style={styles.avatarDot}><Text>♡</Text></View>
            </View>

            <View style={styles.heroCard}>
              <Text style={styles.cardLabel}>TODAY'S LOOK</Text>
              <Avatar top={top} bottom={bottom} shoes={shoes} />
              <Pressable style={styles.primaryBtn} onPress={() => setTab("dressing")}>
                <Text style={styles.primaryText}>Change look</Text>
              </Pressable>
            </View>

            <Text style={styles.sectionTitle}>Quick access</Text>
            <View style={styles.quickRow}>
              <Quick label={`${items.length} items`} onPress={() => setTab("wardrobe")} />
              <Quick label={`${looks.length} looks`} onPress={() => setTab("looks")} />
            </View>
          </ScrollView>
        )}

        {tab === "wardrobe" && (
          <ScrollView contentContainerStyle={styles.screen}>
            <Text style={styles.eyebrow}>YOUR CLOSET</Text>
            <Text style={styles.title}>Wardrobe</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 16 }}>
              {categories.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setFilter(c)}
                  style={[styles.chip, filter === c && styles.chipActive]}
                >
                  <Text style={[styles.chipText, filter === c && styles.chipTextActive]}>{c}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.grid}>
              {filteredItems.map((item) => (
                <View key={item.id} style={styles.itemCard}>
                  {item.uri ? (
                    <Image source={{ uri: item.uri }} style={styles.itemImage} resizeMode="cover" />
                  ) : (
                    <View style={[styles.itemImage, { backgroundColor: item.color }]} />
                  )}
                  <Text style={styles.itemLabel}>{item.label}</Text>
                </View>
              ))}
            </View>

            <Pressable style={styles.addBtn} onPress={addItem}>
              <Text style={styles.addText}>＋ Add item</Text>
            </Pressable>
            <Text style={styles.helper}>Per V0.1 usa foto del capo isolato. Il crop è manuale.</Text>
          </ScrollView>
        )}

        {tab === "dressing" && (
          <ScrollView contentContainerStyle={styles.screen}>
            <Text style={styles.eyebrow}>PLAY WITH YOUR CLOSET</Text>
            <Text style={styles.title}>Dressing Room</Text>

            <View style={styles.heroCard}>
              <Avatar top={top} bottom={bottom} shoes={shoes} />
            </View>

            <PickerRow
              title="TOP"
              item={top}
              onPrev={() => setSelectedTop(cycle("Tops", selectedTop, -1) || selectedTop)}
              onNext={() => setSelectedTop(cycle("Tops", selectedTop, 1) || selectedTop)}
            />
            <PickerRow
              title="BOTTOM"
              item={bottom}
              onPrev={() => setSelectedBottom(cycle("Bottoms", selectedBottom, -1) || selectedBottom)}
              onNext={() => setSelectedBottom(cycle("Bottoms", selectedBottom, 1) || selectedBottom)}
            />
            <PickerRow
              title="SHOES"
              item={shoes}
              onPrev={() => setSelectedShoes(cycle("Shoes", selectedShoes, -1) || selectedShoes)}
              onNext={() => setSelectedShoes(cycle("Shoes", selectedShoes, 1) || selectedShoes)}
            />

            <View style={styles.actionRow}>
              <Pressable style={styles.secondaryBtn} onPress={() => {
                const tops = items.filter(i => i.category === "Tops");
                const bottoms = items.filter(i => i.category === "Bottoms");
                const shoeList = items.filter(i => i.category === "Shoes");
                if (tops.length) setSelectedTop(tops[Math.floor(Math.random()*tops.length)].id);
                if (bottoms.length) setSelectedBottom(bottoms[Math.floor(Math.random()*bottoms.length)].id);
                if (shoeList.length) setSelectedShoes(shoeList[Math.floor(Math.random()*shoeList.length)].id);
              }}>
                <Text style={styles.secondaryText}>Shuffle</Text>
              </Pressable>
              <Pressable style={styles.primaryBtnSmall} onPress={saveLook}>
                <Text style={styles.primaryText}>♡ Save look</Text>
              </Pressable>
            </View>
          </ScrollView>
        )}

        {tab === "looks" && (
          <ScrollView contentContainerStyle={styles.screen}>
            <Text style={styles.eyebrow}>SAVED</Text>
            <Text style={styles.title}>Looks</Text>
            {looks.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No looks yet</Text>
                <Text style={styles.subtitle}>Crea un outfit nel Dressing Room e salvalo.</Text>
                <Pressable style={styles.primaryBtn} onPress={() => setTab("dressing")}>
                  <Text style={styles.primaryText}>Create first look</Text>
                </Pressable>
              </View>
            ) : (
              looks.map((look) => {
                const lt = items.find(i => i.id === look.top);
                const lb = items.find(i => i.id === look.bottom);
                const ls = items.find(i => i.id === look.shoes);
                return (
                  <Pressable key={look.id} style={styles.lookCard} onPress={() => loadLook(look)}>
                    <Avatar top={lt} bottom={lb} shoes={ls} compact />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.lookTitle}>{look.name}</Text>
                      <Text style={styles.subtitle}>Tap to wear again</Text>
                    </View>
                    <Text style={styles.arrow}>›</Text>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        )}

        <BottomNav tab={tab} setTab={setTab} />
      </View>
    </SafeAreaView>
  );
}

function Avatar({
  top,
  bottom,
  shoes,
  compact = false,
}: {
  top?: Item;
  bottom?: Item;
  shoes?: Item;
  compact?: boolean;
}) {
  const h = compact ? 150 : 360;
  return (
    <View style={[styles.avatarStage, { height: h }]}>
      <View style={[styles.head, compact && { width: 34, height: 44, borderRadius: 18 }]} />
      <View style={[styles.neck, compact && { width: 9, height: 10 }]} />
      <GarmentBlock item={top} style={[styles.topBlock, compact && { width: 62, height: 50, top: 47 }]} />
      <GarmentBlock item={bottom} style={[styles.bottomBlock, compact && { width: 54, height: 48, top: 92 }]} />
      <View style={[styles.legs, compact && { height: 18, top: 126 }]} />
      <View style={[styles.shoeRow, compact && { top: 140 }]}>
        <MiniShoe item={shoes} />
        <MiniShoe item={shoes} />
      </View>
    </View>
  );
}

function GarmentBlock({ item, style }: { item?: Item; style: any }) {
  if (item?.uri) {
    return <Image source={{ uri: item.uri }} style={[style, { borderRadius: 22 }]} resizeMode="cover" />;
  }
  return <View style={[style, { backgroundColor: item?.color || "#E9DED0" }]} />;
}

function MiniShoe({ item }: { item?: Item }) {
  if (item?.uri) {
    return <Image source={{ uri: item.uri }} style={styles.shoe} resizeMode="cover" />;
  }
  return <View style={[styles.shoe, { backgroundColor: item?.color || "#D8D4CE" }]} />;
}

function Quick({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.quickCard} onPress={onPress}>
      <Text style={styles.quickNumber}>{label}</Text>
      <Text style={styles.subtitle}>Open ›</Text>
    </Pressable>
  );
}

function PickerRow({
  title,
  item,
  onPrev,
  onNext,
}: {
  title: string;
  item?: Item;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <View style={styles.pickerRow}>
      <Pressable style={styles.arrowBtn} onPress={onPrev}><Text style={styles.arrow}>‹</Text></Pressable>
      <View style={{ alignItems: "center", flex: 1 }}>
        <Text style={styles.cardLabel}>{title}</Text>
        <Text style={styles.itemLabel}>{item?.label || "None"}</Text>
      </View>
      <Pressable style={styles.arrowBtn} onPress={onNext}><Text style={styles.arrow}>›</Text></Pressable>
    </View>
  );
}

function BottomNav({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "home", label: "Home", icon: "⌂" },
    { key: "wardrobe", label: "Wardrobe", icon: "▦" },
    { key: "dressing", label: "Dressing", icon: "◌" },
    { key: "looks", label: "Looks", icon: "♡" },
  ];
  return (
    <View style={styles.nav}>
      {tabs.map((t) => (
        <Pressable key={t.key} style={styles.navItem} onPress={() => setTab(t.key)}>
          <Text style={[styles.navIcon, tab === t.key && styles.navActive]}>{t.icon}</Text>
          <Text style={[styles.navLabel, tab === t.key && styles.navActive]}>{t.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  shell: { flex: 1, backgroundColor: palette.bg },
  screen: { padding: 22, paddingBottom: 120 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  eyebrow: { fontSize: 11, letterSpacing: 2.2, fontWeight: "700", color: palette.muted, marginBottom: 8 },
  title: { fontSize: 31, lineHeight: 36, fontWeight: "700", color: palette.ink, letterSpacing: -0.8 },
  subtitle: { fontSize: 14, color: palette.muted, marginTop: 5, lineHeight: 20 },
  avatarDot: { width: 44, height: 44, borderRadius: 22, backgroundColor: palette.paper, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: palette.line },
  heroCard: { backgroundColor: palette.paper, borderRadius: 30, padding: 18, marginTop: 22, borderWidth: 1, borderColor: palette.line },
  cardLabel: { fontSize: 10, letterSpacing: 1.8, fontWeight: "700", color: palette.muted },
  avatarStage: { alignItems: "center", position: "relative", overflow: "hidden", marginVertical: 8 },
  head: { width: 74, height: 92, borderRadius: 38, backgroundColor: "#D8B49A", marginTop: 4 },
  neck: { width: 18, height: 18, backgroundColor: "#D8B49A" },
  topBlock: { position: "absolute", top: 108, width: 150, height: 115, borderRadius: 34 },
  bottomBlock: { position: "absolute", top: 213, width: 132, height: 105, borderRadius: 20 },
  legs: { position: "absolute", top: 306, width: 68, height: 45, backgroundColor: "#D8B49A", borderRadius: 18 },
  shoeRow: { position: "absolute", top: 338, flexDirection: "row", gap: 8 },
  shoe: { width: 48, height: 18, borderRadius: 10 },
  primaryBtn: { backgroundColor: palette.ink, borderRadius: 18, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  primaryBtnSmall: { backgroundColor: palette.ink, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 24, alignItems: "center" },
  primaryText: { color: "white", fontWeight: "700", fontSize: 15 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: palette.ink, marginTop: 26, marginBottom: 12 },
  quickRow: { flexDirection: "row", gap: 12 },
  quickCard: { flex: 1, backgroundColor: palette.paper, padding: 18, borderRadius: 22, borderWidth: 1, borderColor: palette.line },
  quickNumber: { fontSize: 17, fontWeight: "700", color: palette.ink },
  chip: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 18, backgroundColor: palette.chip, marginRight: 8 },
  chipActive: { backgroundColor: palette.ink },
  chipText: { color: palette.ink, fontWeight: "600", fontSize: 13 },
  chipTextActive: { color: "white" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  itemCard: { width: "47%", backgroundColor: palette.paper, borderRadius: 20, padding: 10, borderWidth: 1, borderColor: palette.line },
  itemImage: { width: "100%", height: 150, borderRadius: 15 },
  itemLabel: { color: palette.ink, fontWeight: "600", marginTop: 9, fontSize: 13 },
  addBtn: { marginTop: 20, borderRadius: 18, padding: 16, alignItems: "center", borderWidth: 1, borderColor: palette.ink },
  addText: { color: palette.ink, fontWeight: "700" },
  helper: { fontSize: 12, color: palette.muted, textAlign: "center", marginTop: 10 },
  pickerRow: { flexDirection: "row", alignItems: "center", backgroundColor: palette.paper, padding: 12, borderRadius: 20, marginTop: 10, borderWidth: 1, borderColor: palette.line },
  arrowBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: palette.bg, alignItems: "center", justifyContent: "center" },
  arrow: { fontSize: 30, color: palette.ink, fontWeight: "300" },
  actionRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 16, gap: 10 },
  secondaryBtn: { flex: 1, borderRadius: 18, paddingVertical: 14, alignItems: "center", backgroundColor: palette.chip },
  secondaryText: { color: palette.ink, fontWeight: "700" },
  empty: { backgroundColor: palette.paper, borderRadius: 26, padding: 24, marginTop: 20, borderWidth: 1, borderColor: palette.line },
  emptyTitle: { fontSize: 22, fontWeight: "700", color: palette.ink },
  lookCard: { backgroundColor: palette.paper, borderRadius: 22, padding: 14, marginTop: 12, borderWidth: 1, borderColor: palette.line, flexDirection: "row", alignItems: "center", gap: 12 },
  lookTitle: { fontSize: 17, fontWeight: "700", color: palette.ink },
  nav: { position: "absolute", left: 14, right: 14, bottom: 12, backgroundColor: "rgba(255,253,252,0.96)", borderRadius: 24, paddingVertical: 10, flexDirection: "row", borderWidth: 1, borderColor: palette.line },
  navItem: { flex: 1, alignItems: "center", gap: 2 },
  navIcon: { fontSize: 20, color: palette.muted },
  navLabel: { fontSize: 10, color: palette.muted, fontWeight: "600" },
  navActive: { color: palette.ink, fontWeight: "800" },
});
