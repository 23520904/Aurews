import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useSystemStore } from "../../src/stores";
import { COLORS, FONTS } from "../../src/constants/theme";

const { width, height } = Dimensions.get("window");

// DỮ LIỆU ĐÃ VIỆT HÓA
const SLIDES = [
  {
    id: "1",
    image: require("../../assets/images/logo.png"),
    title: "Cập nhật tin tức nóng hổi",
    text: "Nắm bắt mọi chuyển động của thế giới ngay trong tầm tay bạn với tốc độ nhanh nhất.",
  },
  {
    id: "2",
    image: require("../../assets/images/react-logo.png"),
    title: "Cá nhân hóa trải nghiệm",
    text: "Chỉ đọc những gì bạn quan tâm. Hệ thống thông minh sẽ gợi ý nội dung phù hợp nhất.",
  },
  {
    id: "3",
    image: require("../../assets/images/partial-react-logo.png"),
    title: "Kết nối cộng đồng",
    text: "Chia sẻ quan điểm, thảo luận và trở thành một phần của cộng đồng tri thức.",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const { completeOnboarding } = useSystemStore();

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      completeOnboarding();
      router.push("/onboarding/welcome");
    }
  };

  const onScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(slideIndex);
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Image
              source={item.image}
              style={styles.image}
              resizeMode="cover"
            />
            <View style={styles.textContainer}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.text}>{item.text}</Text>
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, currentIndex === index && styles.activeDot]}
            />
          ))}
        </View>

        <View style={styles.buttonRow}>
          {currentIndex > 0 ? (
            <TouchableOpacity
              onPress={() =>
                flatListRef.current?.scrollToIndex({ index: currentIndex - 1 })
              }
            >
              <Text style={styles.backText}>Quay lại</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}

          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>
              {currentIndex === SLIDES.length - 1 ? "Bắt đầu" : "Tiếp tục"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  slide: { width, height: height },
  image: { width: "100%", height: "60%" },
  textContainer: { flex: 1, padding: 24, paddingTop: 32 },
  title: {
    fontSize: 26,
    color: COLORS.secondary,
    marginBottom: 12,
    ...FONTS.heavy,
  },
  text: {
    fontSize: 16,
    color: COLORS.textGray,
    lineHeight: 24,
    ...FONTS.regular,
  },

  footer: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pagination: { flexDirection: "row", gap: 8 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.border,
  },
  activeDot: { backgroundColor: COLORS.primary, width: 24 },

  buttonRow: { flexDirection: "row", alignItems: "center", gap: 20 },
  backText: { color: COLORS.textGray, fontSize: 16, ...FONTS.medium },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  buttonText: { color: COLORS.white, fontSize: 16, ...FONTS.bold },
});
