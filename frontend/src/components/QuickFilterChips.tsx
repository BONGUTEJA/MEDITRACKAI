import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export interface FilterChipOption {
  key: string;
  label: string;
  count?: number;
}

interface QuickFilterChipsProps {
  options: FilterChipOption[];
  selectedKey: string;
  onSelect: (key: string) => void;
}

export default function QuickFilterChips({
  options,
  selectedKey,
  onSelect,
}: QuickFilterChipsProps) {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {options.map((opt) => {
          const isSelected = selectedKey === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => onSelect(opt.key)}
              activeOpacity={0.75}
            >
              <Text style={[styles.label, isSelected && styles.labelSelected]}>
                {opt.label}
              </Text>
              {typeof opt.count === "number" && (
                <View style={[styles.countBadge, isSelected && styles.countBadgeSelected]}>
                  <Text style={[styles.countText, isSelected && styles.countTextSelected]}>
                    {opt.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  scroll: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
  },
  chipSelected: {
    backgroundColor: "#0284C7",
    borderColor: "#0284C7",
    shadowColor: "#0284C7",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
    color: "#334E68",
  },
  labelSelected: {
    color: "#FFFFFF",
  },
  countBadge: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeSelected: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  countText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#0284C7",
  },
  countTextSelected: {
    color: "#FFFFFF",
  },
});
