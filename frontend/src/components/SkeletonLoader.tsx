import React, { useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet, View, ViewStyle, StyleProp } from "react-native";

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function SkeletonItem({
  width = "100%",
  height = 20,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const opacityAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const isNative = Platform.OS !== "web";
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: isNative,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: isNative,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height: height as any,
          borderRadius,
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );
}

export function SkeletonKpiCard() {
  return (
    <View style={styles.kpiCard}>
      <SkeletonItem width={48} height={48} borderRadius={14} style={{ marginBottom: 12 }} />
      <SkeletonItem width={80} height={28} borderRadius={8} style={{ marginBottom: 6 }} />
      <SkeletonItem width={110} height={14} borderRadius={6} />
    </View>
  );
}

export function SkeletonModuleTile() {
  return (
    <View style={styles.tile}>
      <SkeletonItem width={48} height={48} borderRadius={14} style={{ marginBottom: 12 }} />
      <SkeletonItem width={140} height={20} borderRadius={6} style={{ marginBottom: 8 }} />
      <SkeletonItem width="100%" height={14} borderRadius={4} style={{ marginBottom: 4 }} />
      <SkeletonItem width="80%" height={14} borderRadius={4} />
    </View>
  );
}

export function SkeletonListItem() {
  return (
    <View style={styles.listItem}>
      <SkeletonItem width={44} height={44} borderRadius={12} style={{ marginRight: 14 }} />
      <View style={{ flex: 1, gap: 6 }}>
        <SkeletonItem width="60%" height={18} borderRadius={6} />
        <SkeletonItem width="40%" height={14} borderRadius={4} />
      </View>
      <SkeletonItem width={70} height={28} borderRadius={8} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: "#BAE6FD",
  },
  kpiCard: {
    flex: 1,
    minWidth: 150,
    borderRadius: 18,
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
  },
  tile: {
    width: "48%",
    minWidth: 260,
    flexGrow: 1,
    borderRadius: 20,
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    marginBottom: 10,
  },
});

export default SkeletonItem;
