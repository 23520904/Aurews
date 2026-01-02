import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useAudio } from '../contexts/AudioContext';
import { useTheme } from '../hooks/theme.hook';
import { useRouter, usePathname, Href } from 'expo-router'; // [FIX] Import Href & usePathname
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    interpolate,
    Extrapolation,
    useDerivedValue
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// CẤU HÌNH UI
const PLAYER_WIDTH = SCREEN_WIDTH - 30;
const PLAYER_HEIGHT = 65;
const DOCKED_WIDTH = 40;
const DOCKED_HEIGHT = 80;
const BOTTOM_OFFSET = 90;

// [FIX] Physics đầm, ít nảy
const SMOOTH_SPRING = { damping: 40, stiffness: 250, mass: 1 };

export const DraggablePlayer = () => {
    // [FIX] Lấy progress từ Context
    const { currentTrack, isPlaying, pauseAudio, resumeAudio, closePlayer, isLoadingAudio, nextTrack, playlist, progress } = useAudio();
    const theme = useTheme();
    const router = useRouter();
    const pathname = usePathname(); // [FIX] Lấy đường dẫn hiện tại
    const insets = useSafeAreaInsets();

    const TOP_LIMIT = insets.top + 10;

    // Animation Values
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const contextX = useSharedValue(0);
    const contextY = useSharedValue(0);
    const dockProgress = useSharedValue(0);
    const dockSide = useSharedValue<0 | 1 | 2>(0);

    useEffect(() => {
        if (currentTrack && dockProgress.value === 0) {
            translateX.value = withSpring(0, SMOOTH_SPRING);
            translateY.value = withSpring(0, SMOOTH_SPRING);
        }
    }, [currentTrack]);

    // [FIX] Hàm chuyển trang thông minh
    const handleOpenDetail = () => {
        if (!currentTrack) return;
        const targetPath = `/post/${currentTrack.slug}`;

        // Nếu đang ở trang đó rồi thì thôi, không push nữa
        if (pathname === targetPath) return;

        router.push(targetPath as Href);
    };

    // --- GESTURE ---
    const pan = Gesture.Pan()
        .onStart(() => {
            contextX.value = translateX.value;
            contextY.value = translateY.value;
        })
        .onUpdate((event) => {
            translateX.value = contextX.value + event.translationX;
            translateY.value = contextY.value + event.translationY;
        })
        .onEnd((event) => {
            const tossX = event.velocityX * 0.2;
            const predictedX = translateX.value + tossX;
            const threshold = SCREEN_WIDTH * 0.25;

            if (predictedX > threshold) {
                // Snap Right
                translateX.value = withSpring(SCREEN_WIDTH / 2 - DOCKED_WIDTH / 2, SMOOTH_SPRING);
                // Kẹp vào mép phải
                translateX.value = withSpring((SCREEN_WIDTH - DOCKED_WIDTH) / 2, SMOOTH_SPRING);
                dockProgress.value = withSpring(1, SMOOTH_SPRING);
                dockSide.value = 2;
            }
            else if (predictedX < -threshold) {
                // Snap Left
                translateX.value = withSpring(-(SCREEN_WIDTH - DOCKED_WIDTH) / 2, SMOOTH_SPRING);
                dockProgress.value = withSpring(1, SMOOTH_SPRING);
                dockSide.value = 1;
            }
            else {
                // Center
                translateX.value = withSpring(0, SMOOTH_SPRING);
                translateY.value = withSpring(0, SMOOTH_SPRING);
                dockProgress.value = withSpring(0, SMOOTH_SPRING);
                dockSide.value = 0;
            }

            // Kẹp trục Y trong màn hình
            if (dockSide.value !== 0) {
                const maxUp = -SCREEN_HEIGHT + BOTTOM_OFFSET + TOP_LIMIT;
                const maxDown = 0;
                if (translateY.value < maxUp) translateY.value = withSpring(maxUp, SMOOTH_SPRING);
                else if (translateY.value > maxDown) translateY.value = withSpring(maxDown, SMOOTH_SPRING);
            }
        });

    const animatedContainerStyle = useAnimatedStyle(() => {
        const width = interpolate(dockProgress.value, [0, 1], [PLAYER_WIDTH, DOCKED_WIDTH]);
        const height = interpolate(dockProgress.value, [0, 1], [PLAYER_HEIGHT, DOCKED_HEIGHT]);
        const isRight = dockSide.value === 2;
        const isLeft = dockSide.value === 1;
        const activeRadius = interpolate(dockProgress.value, [0, 1], [12, 20]);
        const zeroRadius = interpolate(dockProgress.value, [0, 1], [12, 0]);

        return {
            transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
            width, height,
            borderTopLeftRadius: isRight ? activeRadius : (isLeft ? zeroRadius : 12),
            borderBottomLeftRadius: isRight ? activeRadius : (isLeft ? zeroRadius : 12),
            borderTopRightRadius: isLeft ? activeRadius : (isRight ? zeroRadius : 12),
            borderBottomRightRadius: isLeft ? activeRadius : (isRight ? zeroRadius : 12),
            backgroundColor: theme.card,
            shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 5, zIndex: 1000, overflow: 'hidden'
        };
    });

    const playerContentStyle = useAnimatedStyle(() => ({
        opacity: interpolate(dockProgress.value, [0, 0.5], [1, 0], Extrapolation.CLAMP),
        transform: [{ scale: interpolate(dockProgress.value, [0, 1], [1, 0.8]) }],
        flex: 1, flexDirection: 'row', alignItems: 'center',
        display: dockProgress.value > 0.9 ? 'none' : 'flex'
    }));

    const dockContentStyle = useAnimatedStyle(() => ({
        opacity: interpolate(dockProgress.value, [0.5, 1], [0, 1], Extrapolation.CLAMP),
        transform: [{ scale: interpolate(dockProgress.value, [0, 1], [0.5, 1]) }],
        position: 'absolute', width: '100%', height: '100%',
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: theme.primary,
    }));

    const ArrowIcon = () => {
        const iconName = translateX.value > 0 ? "chevron-back" : "chevron-forward";
        return <Ionicons name={iconName} size={24} color="#fff" />;
    }

    const handleExpand = () => {
        translateX.value = withSpring(0, SMOOTH_SPRING);
        translateY.value = withSpring(0, SMOOTH_SPRING);
        dockProgress.value = withSpring(0, SMOOTH_SPRING);
        dockSide.value = 0;
    };

    if (!currentTrack) return null;

    return (
        <View style={styles.overlayWrapper} pointerEvents="box-none">
            <GestureDetector gesture={pan}>
                <Animated.View style={animatedContainerStyle}>

                    {/* DOCK VIEW */}
                    <Animated.View style={dockContentStyle}>
                        <TouchableOpacity style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' }} onPress={handleExpand}>
                            <ArrowIcon />
                        </TouchableOpacity>
                    </Animated.View>

                    {/* FULL PLAYER VIEW */}
                    <Animated.View style={playerContentStyle}>
                        {/* [FIX] Progress Bar chạy theo state progress */}
                        <View style={{ height: 2, width: '100%', backgroundColor: theme.border, position: 'absolute', top: 0, left: 0 }}>
                            <View style={{
                                height: '100%',
                                width: `${progress * 100}%`, // Width động
                                backgroundColor: theme.primary
                            }} />
                        </View>

                        <TouchableOpacity
                            style={styles.infoContainer}
                            onPress={handleOpenDetail} // [FIX] Dùng hàm navigate thông minh
                            activeOpacity={0.9}
                        >
                            <Image source={{ uri: currentTrack.thumbnail }} style={styles.thumbnail} />
                            <View style={styles.textContainer}>
                                <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                                    {currentTrack.title}
                                </Text>
                                <Text style={[styles.author, { color: theme.textSecondary }]}>
                                    {playlist.length > 1 ? "Đang phát Radio" : "Tin tức"}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <View style={styles.controls}>
                            {isLoadingAudio ? (
                                <ActivityIndicator color={theme.primary} style={{ marginRight: 10 }} />
                            ) : (
                                <TouchableOpacity onPress={isPlaying ? pauseAudio : resumeAudio}>
                                    <Ionicons name={isPlaying ? "pause" : "play"} size={22} color={theme.text} />
                                </TouchableOpacity>
                            )}
                            {playlist.length > 1 && (
                                <TouchableOpacity onPress={nextTrack} style={{ marginLeft: 15 }}>
                                    <Ionicons name="play-skip-forward" size={22} color={theme.text} />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={closePlayer} style={{ marginLeft: 15, marginRight: 10 }}>
                                <Ionicons name="close" size={24} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                </Animated.View>
            </GestureDetector>
        </View>
    );
};

const styles = StyleSheet.create({
    overlayWrapper: {
        position: 'absolute',
        bottom: BOTTOM_OFFSET,
        left: 0, right: 0,
        alignItems: 'center',
        zIndex: 9999,
    },
    infoContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingLeft: 10 },
    thumbnail: { width: 40, height: 40, borderRadius: 6, marginRight: 10 },
    textContainer: { flex: 1, justifyContent: 'center', marginRight: 10 },
    title: { fontSize: 13, fontWeight: '700' },
    author: { fontSize: 11 },
    controls: { flexDirection: 'row', alignItems: 'center' },
});