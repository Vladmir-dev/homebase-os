import Colors from '@/constants/Colors';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { BorderRadius, Shadows, Spacing } from './Spacing';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outline';
  style?: ViewStyle;
  onPress?: () => void;
}

export function Card({ children, variant = 'default', style, onPress }: CardProps) {
  const cardStyle = [
    styles.card,
    styles[`card_${variant}`],
    style,
  ];

  const Component = View;
  return <Component style={cardStyle}>{children}</Component>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  
  // Variants
  card_default: {
    backgroundColor: Colors.TruHub.cardBg,
    borderWidth: 1,
    borderColor: Colors.TruHub.cardBorder,
  },
  card_elevated: {
    backgroundColor: Colors.TruHub.white,
    ...Shadows.md,
  },
  card_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.TruHub.blue,
  },
});
