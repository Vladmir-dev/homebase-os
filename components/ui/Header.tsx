import Colors from '@/constants/Colors';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Spacing, Typography } from './Spacing';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  style?: ViewStyle;
}

export function Header({ title, subtitle, style }: HeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: '700',
    color: Colors.light.text,
    flex: 1,
  },
  
  subtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.light.muted,
    fontWeight: '500',
    marginLeft: Spacing.lg,
  },
});
