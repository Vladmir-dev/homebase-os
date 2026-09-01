import Colors from '@/constants/Colors';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Spacing, Typography } from './Spacing';

export interface SectionProps {
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Section({ title, children, style }: SectionProps) {
  return (
    <View style={[styles.container, style]}>
      {title && <Text style={styles.title}>{title}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
});
