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

const C = {
  bg: "#F4F0EA",
  paper: "#FCFAF7",
  ink: "#1B1A18",
  muted: "#77716B",
  soft: "#AAA198",
  line: "#E5DED6",
  chip: "#EBE4DD",
  skin: "#D4A587",
  hair: "#2B2724",
};

const demoItems: Item[] = [
  { id: "t1", category: "Tops", label: "Ivory knit", color: "#E9DED0" },
  { id: "t2", category: "Tops", label: "Black tee", color: "#2E2B29" },
  { id: "b1", category: "Bottoms", label: "Blue jeans", color: "#879CAA" },
  { id: "b2", category: "Bottoms", label: "Cream skirt", color: "#DCCDBA" },
  { id: "s1", category: "Shoes", label: "Sneakers", color: "#D8D4CE" },
  { id: "s2", category: "Shoes", label: "Black boots", color: "#3D3834" },
];

const categories: Category[] = ["Tops", "Bottoms", "Dresses", "Shoes", "Bags", "Accessories"];

function nextId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
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

  const filtered = useMemo(
    () => items.filter((x) => x.category === filter),
    [items, filter]
  );

  const cycle = (category: Category, current: string, dir: number) => {
    const list = items.filter((x) => x.category === category);
    if (!list.length) return current;
    const index = Math.max(0, list.findIndex((x) => x.id === current));
    return list[(index + dir + list.length) % list.length].id;
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
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
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

    if (result.canceled || !result.assets[0]?.uri) return;

    setItems((old) => [
      ...old,
      {
        id: nextId(),
        category: filter,
        uri: result.assets[0].uri,
        label: `My ${filter.slice(0, -1) || filter}`,
        color: "#E7DDD4",
      },
    ]);
  };

  const saveLook = () => {
    setLooks((old) => [
      {
        id: nextId(),
        name: `Look ${old.length + 1}`,
        top: selectedTop,
        bottom: selectedBottom,
        shoes: selectedShoes,
      },
      ...old,
    ]);
    Alert.alert("Saved", "Look salvato.");
  };

  const shuffle = () => {
    const pick = (category: Category) => {
      const list = items.filter((x) => x.category === category);
      return list.length ? list[Math.floor(Math.random() * list.length)].id : undefined;
    };
    setSelectedTop(pick("Tops") || selectedTop);
    setSelectedBottom(pick("Bottoms") || selectedBottom);
    setSelectedShoes(pick("Shoes") || selectedShoes);
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style="dark" />
      <View style={s.shell}>
        {tab === "home" && (
          <ScrollView contentContainerStyle={s.home} showsVerticalScrollIndicator={false}>
            <View style={s.topbar}>
              <View>
                <Text style={s.brand}>WARDROBE</Text>
                <Text style={s.homeTitle}>{greeting()}, Bea</Text>
              </View>
              <View style={s.profile}><Text style={s.profileText}>B</Text></View>
            </View>

            <Text style={s.intro}>What do you feel like wearing today?</Text>

            <View style={s.hero}>
              <View style={s.heroHeader}>
                <View>
                  <Text style={s.kicker}>TODAY'S LOOK</Text>
                  <Text style={s.lookName}>Soft minimal</Text>
                </View>
                <View style={s.numberBadge}><Text style={s.badgeText}>01</Text></View>
              </View>

              <Avatar top={top} bottom={bottom} shoes={shoes} />

              <View style={s.outfitLine}>
                <Text style={s.outfitText}>{top?.label || "Top"}</Text>
                <Text style={s.dot}>•</Text>
                <Text style={s.outfitText}>{bottom?.label || "Bottom"}</Text>
                <Text style={s.dot}>•</Text>
                <Text style={s.outfitText}>{shoes?.label || "Shoes"}</Text>
              </View>

              <Pressable style={s.primary} onPress={() => setTab("dressing")}>
                <Text style={s.primaryText}>Change look</Text>
                <Text style={s.primaryArrow}>→</Text>
              </Pressable>
            </View>

            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Your space</Text>
              <Text style={s.sectionHint}>Everything close</Text>
            </View>

            <View style={s.quickRow}>
              <Quick title="CLOSET" value={String(items.length)} label="pieces" icon="▦" onPress={() => setTab("wardrobe")} />
              <Quick title="SAVED" value={String(looks.length)} label="looks" icon="♡" onPress={() => setTab("looks")} />
            </View>
          </ScrollView>
        )}

        {tab === "wardrobe" && (
          <ScrollView contentContainerStyle={s.screen} showsVerticalScrollIndicator={false}>
            <Text style={s.kicker}>YOUR CLOSET</Text>
            <Text style={s.title}>Wardrobe</Text>
            <Text style={s.subtitle}>Your pieces, without the noise.</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.categories}>
              {categories.map((category) => (
                <Pressable
                  key={category}
                  onPress={() => setFilter(category)}
                  style={[s.chip, filter === category && s.chipActive]}
                >
                  <Text style={[s.chipText, filter === category && s.chipTextActive]}>
                    {category}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={s.grid}>
              {filtered.map((item) => (
                <View key={item.id} style={s.itemCard}>
                  {item.uri ? (
                    <Image source={{ uri: item.uri }} style={s.itemImage} resizeMode="cover" />
                  ) : (
                    <View style={[s.itemImage, { backgroundColor: item.color }]} />
                  )}
                  <Text style={s.itemLabel}>{item.label}</Text>
                  <Text style={s.itemCategory}>{item.category}</Text>
                </View>
              ))}
            </View>

            <Pressable style={s.addButton} onPress={addItem}>
              <Text style={s.addText}>＋ Add a piece</Text>
            </Pressable>
          </ScrollView>
        )}

        {tab === "dressing" && (
          <ScrollView contentContainerStyle={s.screen} showsVerticalScrollIndicator={false}>
            <Text style={s.kicker}>DRESSING ROOM</Text>
            <Text style={s.title}>Build the look</Text>
            <Text style={s.subtitle}>Switch one piece at a time.</Text>

            <View style={s.dressingCard}>
              <View style={s.dressingHeader}>
                <Text style={s.kicker}>CURRENT LOOK</Text>
                <Pressable onPress={shuffle}><Text style={s.textAction}>Shuffle ↻</Text></Pressable>
              </View>
              <Avatar top={top} bottom={bottom} shoes={shoes} />
            </View>

            <PickerRow
              title="TOP"
              item={top}
              onPrev={() => setSelectedTop(cycle("Tops", selectedTop, -1))}
              onNext={() => setSelectedTop(cycle("Tops", selectedTop, 1))}
            />
            <PickerRow
              title="BOTTOM"
              item={bottom}
              onPrev={() => setSelectedBottom(cycle("Bottoms", selectedBottom, -1))}
              onNext={() => setSelectedBottom(cycle("Bottoms", selectedBottom, 1))}
            />
            <PickerRow
              title="SHOES"
              item={shoes}
              onPrev={() => setSelectedShoes(cycle("Shoes", selectedShoes, -1))}
              onNext={() => setSelectedShoes(cycle("Shoes", selectedShoes, 1))}
            />

            <Pressable style={s.saveButton} onPress={saveLook}>
              <Text style={s.saveText}>♡  Save this look</Text>
            </Pressable>
          </ScrollView>
        )}

        {tab === "looks" && (
          <ScrollView contentContainerStyle={s.screen} showsVerticalScrollIndicator={false}>
            <Text style={s.kicker}>SAVED</Text>
            <Text style={s.title}>Looks</Text>
            <Text style={s.subtitle}>Outfits worth wearing again.</Text>

            {looks.length === 0 ? (
              <View style={s.empty}>
                <Text style={s.emptyIcon}>♡</Text>
                <Text style={s.emptyTitle}>Your looks live here</Text>
                <Text style={s.emptyCopy}>Create an outfit in the Dressing Room and save it when it feels right.</Text>
                <Pressable style={s.primary} onPress={() => setTab("dressing")}>
                  <Text style={s.primaryText}>Create first look</Text>
                </Pressable>
              </View>
            ) : (
              looks.map((look) => {
                const lt = items.find((x) => x.id === look.top);
                const lb = items.find((x) => x.id === look.bottom);
                const ls = items.find((x) => x.id === look.shoes);

                return (
                  <Pressable
                    key={look.id}
                    style={s.lookCard}
                    onPress={() => {
                      if (look.top) setSelectedTop(look.top);
                      if (look.bottom) setSelectedBottom(look.bottom);
                      if (look.shoes) setSelectedShoes(look.shoes);
                      setTab("dressing");
                    }}
                  >
                    <View style={s.lookPreview}>
                      <Avatar top={lt} bottom={lb} shoes={ls} compact />
                    </View>
                    <View style={s.lookCopy}>
                      <Text style={s.lookTitle}>{look.name}</Text>
                      <Text style={s.subtitle}>Tap to wear again</Text>
                    </View>
                    <Text style={s.listArrow}>›</Text>
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
  const scale = compact ? 0.42 : 1;

  return (
    <View style={[s.avatarStage, { height: compact ? 132 : 315 }]}>
      <View style={[s.figure, { transform: [{ scale }] }]}>
        <View style={s.hairBack} />
        <View style={s.head}>
          <View style={s.hairTop} />
          <View style={s.eyes}><View style={s.eye} /><View style={s.eye} /></View>
          <View style={s.mouth} />
        </View>
        <View style={s.neck} />
        <View style={s.leftArm} />
        <View style={s.rightArm} />
        <Garment item={top} style={s.topGarment} />
        <Garment item={bottom} style={s.bottomGarment} />
        <View style={s.leftLeg} />
        <View style={s.rightLeg} />
        <View style={s.shoes}>
          <MiniShoe item={shoes} />
          <MiniShoe item={shoes} />
        </View>
      </View>
      {!compact && <View style={s.shadow} />}
    </View>
  );
}

function Garment({ item, style }: { item?: Item; style: any }) {
  return item?.uri
    ? <Image source={{ uri: item.uri }} style={[style, { overflow: "hidden" }]} resizeMode="cover" />
    : <View style={[style, { backgroundColor: item?.color || "#E9DED0" }]} />;
}

function MiniShoe({ item }: { item?: Item }) {
  return item?.uri
    ? <Image source={{ uri: item.uri }} style={s.shoe} resizeMode="cover" />
    : <View style={[s.shoe, { backgroundColor: item?.color || "#D8D4CE" }]} />;
}

function Quick({
  title,
  value,
  label,
  icon,
  onPress,
}: {
  title: string;
  value: string;
  label: string;
  icon: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={s.quickCard} onPress={onPress}>
      <View style={s.quickTop}><Text style={s.quickTitle}>{title}</Text><Text style={s.quickIcon}>{icon}</Text></View>
      <View style={s.quickValueRow}><Text style={s.quickValue}>{value}</Text><Text style={s.quickLabel}>{label}</Text></View>
      <Text style={s.quickOpen}>Open →</Text>
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
    <View style={s.picker}>
      <Pressable style={s.arrowButton} onPress={onPrev}><Text style={s.arrow}>‹</Text></Pressable>
      <View style={s.pickerCopy}>
        <Text style={s.kicker}>{title}</Text>
        <Text style={s.pickerItem}>{item?.label || "None"}</Text>
      </View>
      <Pressable style={s.arrowButton} onPress={onNext}><Text style={s.arrow}>›</Text></Pressable>
    </View>
  );
}

function BottomNav({ tab, setTab }: { tab: Tab; setTab: (tab: Tab) => void }) {
  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "home", label: "Home", icon: "⌂" },
    { key: "wardrobe", label: "Wardrobe", icon: "▦" },
    { key: "dressing", label: "Dressing", icon: "◯" },
    { key: "looks", label: "Looks", icon: "♡" },
  ];

  return (
    <View style={s.navWrap}>
      <View style={s.nav}>
        {tabs.map((item) => {
          const active = tab === item.key;
          return (
            <Pressable key={item.key} style={s.navItem} onPress={() => setTab(item.key)}>
              <View style={[s.navIconWrap, active && s.navIconActive]}>
                <Text style={[s.navIcon, active && s.navIconTextActive]}>{item.icon}</Text>
              </View>
              <Text style={[s.navLabel, active && s.navLabelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  shell: { flex: 1, backgroundColor: C.bg },
  home: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 110 },
  screen: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 110 },

  topbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brand: { fontSize: 10, letterSpacing: 3.1, fontWeight: "800", color: C.soft, marginBottom: 7 },
  homeTitle: { fontSize: 27, lineHeight: 32, fontWeight: "700", color: C.ink, letterSpacing: -0.7 },
  intro: { fontSize: 14, lineHeight: 20, color: C.muted, marginTop: 7, marginBottom: 16 },
  profile: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.ink, alignItems: "center", justifyContent: "center" },
  profileText: { color: C.paper, fontSize: 13, fontWeight: "700" },

  hero: { backgroundColor: C.paper, borderRadius: 28, padding: 18, borderWidth: 1, borderColor: C.line },
  heroHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  kicker: { fontSize: 9, letterSpacing: 1.8, fontWeight: "800", color: C.soft },
  lookName: { fontSize: 21, lineHeight: 26, fontWeight: "700", color: C.ink, marginTop: 4 },
  numberBadge: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: C.line, alignItems: "center", justifyContent: "center" },
  badgeText: { fontSize: 10, fontWeight: "700", color: C.muted },
  outfitLine: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginBottom: 12 },
  outfitText: { fontSize: 10, color: C.muted, maxWidth: 78 },
  dot: { color: C.soft, marginHorizontal: 7 },

  primary: { height: 50, borderRadius: 16, backgroundColor: C.ink, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18 },
  primaryText: { color: C.paper, fontSize: 14, fontWeight: "700" },
  primaryArrow: { color: C.paper, fontSize: 18 },

  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginTop: 22, marginBottom: 11 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: C.ink },
  sectionHint: { fontSize: 11, color: C.soft },
  quickRow: { flexDirection: "row", gap: 10 },
  quickCard: { flex: 1, minHeight: 126, backgroundColor: C.paper, borderRadius: 20, padding: 15, borderWidth: 1, borderColor: C.line },
  quickTop: { flexDirection: "row", justifyContent: "space-between" },
  quickTitle: { fontSize: 8, letterSpacing: 1.5, color: C.soft, fontWeight: "800" },
  quickIcon: { fontSize: 16, color: C.muted },
  quickValueRow: { flexDirection: "row", alignItems: "baseline", gap: 5, marginTop: 14 },
  quickValue: { fontSize: 25, fontWeight: "700", color: C.ink },
  quickLabel: { fontSize: 12, color: C.muted },
  quickOpen: { fontSize: 11, color: C.muted, marginTop: 8, fontWeight: "600" },

  title: { fontSize: 30, lineHeight: 35, fontWeight: "700", color: C.ink, letterSpacing: -0.8 },
  subtitle: { fontSize: 13, color: C.muted, marginTop: 5, lineHeight: 19 },
  categories: { marginTop: 18, marginBottom: 16 },
  chip: { paddingHorizontal: 15, paddingVertical: 9, borderRadius: 17, backgroundColor: C.chip, marginRight: 8 },
  chipActive: { backgroundColor: C.ink },
  chipText: { color: C.ink, fontWeight: "600", fontSize: 12 },
  chipTextActive: { color: C.paper },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  itemCard: { width: "48.4%", backgroundColor: C.paper, borderRadius: 18, padding: 8, borderWidth: 1, borderColor: C.line },
  itemImage: { width: "100%", height: 156, borderRadius: 13 },
  itemLabel: { color: C.ink, fontWeight: "600", marginTop: 9, fontSize: 12 },
  itemCategory: { color: C.soft, fontSize: 10, marginTop: 2 },
  addButton: { marginTop: 18, borderRadius: 16, padding: 15, alignItems: "center", borderWidth: 1, borderColor: C.ink },
  addText: { color: C.ink, fontWeight: "700", fontSize: 13 },

  dressingCard: { backgroundColor: C.paper, borderRadius: 28, paddingHorizontal: 16, paddingTop: 15, marginTop: 18, borderWidth: 1, borderColor: C.line },
  dressingHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  textAction: { fontSize: 11, color: C.muted, fontWeight: "700" },
  picker: { flexDirection: "row", alignItems: "center", backgroundColor: C.paper, padding: 10, borderRadius: 17, marginTop: 9, borderWidth: 1, borderColor: C.line },
  arrowButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" },
  arrow: { fontSize: 27, lineHeight: 29, color: C.ink, fontWeight: "300" },
  pickerCopy: { flex: 1, alignItems: "center" },
  pickerItem: { color: C.ink, fontWeight: "600", marginTop: 4, fontSize: 13 },
  saveButton: { marginTop: 14, height: 50, borderRadius: 16, backgroundColor: C.ink, alignItems: "center", justifyContent: "center" },
  saveText: { color: C.paper, fontSize: 14, fontWeight: "700" },

  empty: { backgroundColor: C.paper, borderRadius: 24, padding: 22, marginTop: 20, borderWidth: 1, borderColor: C.line, alignItems: "center" },
  emptyIcon: { fontSize: 26, color: C.muted, marginBottom: 10 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: C.ink },
  emptyCopy: { color: C.muted, textAlign: "center", fontSize: 13, lineHeight: 19, marginTop: 8, marginBottom: 18 },
  lookCard: { backgroundColor: C.paper, borderRadius: 20, padding: 10, marginTop: 11, borderWidth: 1, borderColor: C.line, flexDirection: "row", alignItems: "center" },
  lookPreview: { width: 76, height: 106, borderRadius: 15, backgroundColor: C.bg, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  lookCopy: { flex: 1, paddingLeft: 12 },
  lookTitle: { fontSize: 16, fontWeight: "700", color: C.ink },
  listArrow: { fontSize: 25, color: C.soft, paddingHorizontal: 6 },

  avatarStage: { alignItems: "center", justifyContent: "flex-start", overflow: "hidden", position: "relative" },
  figure: { width: 190, height: 300, position: "relative", alignItems: "center" },
  hairBack: { position: "absolute", top: 11, width: 72, height: 95, borderRadius: 34, backgroundColor: C.hair },
  head: { position: "absolute", top: 18, width: 58, height: 72, borderRadius: 29, backgroundColor: C.skin, zIndex: 4, alignItems: "center" },
  hairTop: { position: "absolute", top: -2, width: 60, height: 29, borderTopLeftRadius: 30, borderTopRightRadius: 30, borderBottomLeftRadius: 13, backgroundColor: C.hair },
  eyes: { position: "absolute", top: 38, flexDirection: "row", gap: 17 },
  eye: { width: 3, height: 3, borderRadius: 2, backgroundColor: "#54463E" },
  mouth: { position: "absolute", top: 54, width: 9, height: 2, borderRadius: 2, backgroundColor: "#A36E65" },
  neck: { position: "absolute", top: 82, width: 18, height: 20, borderRadius: 7, backgroundColor: C.skin, zIndex: 2 },
  leftArm: { position: "absolute", top: 105, left: 43, width: 20, height: 125, borderRadius: 12, backgroundColor: C.skin, transform: [{ rotate: "4deg" }] },
  rightArm: { position: "absolute", top: 105, right: 43, width: 20, height: 125, borderRadius: 12, backgroundColor: C.skin, transform: [{ rotate: "-4deg" }] },
  topGarment: { position: "absolute", top: 96, width: 96, height: 91, borderRadius: 26, zIndex: 5 },
  bottomGarment: { position: "absolute", top: 176, width: 88, height: 75, borderRadius: 16, zIndex: 5 },
  leftLeg: { position: "absolute", top: 237, left: 70, width: 23, height: 63, borderRadius: 12, backgroundColor: C.skin },
  rightLeg: { position: "absolute", top: 237, right: 70, width: 23, height: 63, borderRadius: 12, backgroundColor: C.skin },
  shoes: { position: "absolute", top: 292, flexDirection: "row", gap: 8, zIndex: 6 },
  shoe: { width: 45, height: 15, borderRadius: 8 },
  shadow: { position: "absolute", bottom: 8, width: 110, height: 13, borderRadius: 55, backgroundColor: "rgba(36,30,25,0.07)" },

  navWrap: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 14, paddingBottom: 10, paddingTop: 6, backgroundColor: "rgba(244,240,234,0.95)" },
  nav: { height: 64, backgroundColor: C.paper, borderRadius: 22, flexDirection: "row", borderWidth: 1, borderColor: C.line, paddingHorizontal: 4 },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 2 },
  navIconWrap: { minWidth: 32, height: 25, paddingHorizontal: 9, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  navIconActive: { backgroundColor: C.ink },
  navIcon: { fontSize: 16, color: C.muted },
  navIconTextActive: { color: C.paper },
  navLabel: { fontSize: 9, color: C.muted, fontWeight: "600" },
  navLabelActive: { color: C.ink, fontWeight: "800" },
});
