import Colors from '@/constants/Colors';
import React from 'react';
import {
    TextInput as RNTextInput,
    TextInputProps as RNTextInputProps,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from 'react-native';
import { BorderRadius, Spacing, Typography } from './Spacing';

export interface InputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  variant?: 'default' | 'outline';
}

export function Input({
  label,
  error,
  containerStyle,
  variant = 'default',
  style,
  placeholderTextColor,
  ...props
}: InputProps) {
  return (
    <View style={containerStyle}>
      {label && <Text style={styles.label}>{label}</Text>}
      <RNTextInput
        style={[
          styles.input,
          styles[`input_${variant}`],
          error && styles.inputError,
          style,
        ]}
        placeholderTextColor={placeholderTextColor || Colors.TruHub.slateLight}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  
  input: {
    fontSize: Typography.sizes.base,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    minHeight: 44,
    fontWeight: '500',
  },
  
  input_default: {
    backgroundColor: Colors.TruHub.cardBg,
    borderWidth: 1,
    borderColor: Colors.TruHub.cardBorder,
    color: Colors.light.text,
  },
  
  input_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.TruHub.blue,
    color: Colors.light.text,
  },
  
  inputError: {
    borderColor: Colors.TruHub.red,
  },
  
  errorText: {
    fontSize: Typography.sizes.xs,
    color: Colors.TruHub.red,
    marginTop: Spacing.sm,
    fontWeight: '500',
  },
});
