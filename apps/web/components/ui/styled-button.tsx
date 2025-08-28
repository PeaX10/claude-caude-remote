import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing } from '../../theme/colors';
import { ViewStyleProp, TextStyleProp } from '../../types/style.types';

export interface StyledButtonProps {
  variant?: 'primary' | 'secondary' | 'minimal';
  size?: 'small' | 'medium' | 'large';
  icon?: keyof typeof Feather.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  style?: ViewStyleProp;
  textStyle?: TextStyleProp;
}

const SIZES = {
  small: { padding: spacing.xs, paddingH: spacing.sm, fontSize: 12, iconSize: 14 },
  medium: { padding: spacing.sm, paddingH: spacing.md, fontSize: 14, iconSize: 16 },
  large: { padding: spacing.md, paddingH: spacing.lg, fontSize: 16, iconSize: 18 }
};

const VARIANTS = {
  primary: {
    backgroundColor: colors.accent.primary,
    textColor: '#ffffff',
    borderWidth: 0,
    borderColor: 'transparent'
  },
  secondary: {
    backgroundColor: 'transparent',
    textColor: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.primary
  },
  minimal: {
    backgroundColor: 'transparent',
    textColor: colors.text.secondary,
    borderWidth: 2,
    borderColor: colors.border.primary
  }
};

export function StyledButton({
  variant = 'primary',
  size = 'medium',
  icon,
  onPress,
  disabled = false,
  children,
  style,
  textStyle
}: StyledButtonProps) {
  const sizeConfig = SIZES[size];
  const variantConfig = VARIANTS[variant];
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          paddingVertical: sizeConfig.padding,
          paddingHorizontal: sizeConfig.paddingH,
          backgroundColor: variantConfig.backgroundColor,
          borderWidth: variantConfig.borderWidth,
          borderColor: variantConfig.borderColor,
          opacity: disabled ? 0.5 : 1,
        },
        style
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {icon && (
        <Feather 
          name={icon}
          size={sizeConfig.iconSize}
          color={variantConfig.textColor}
          style={styles.icon}
        />
      )}
      
      <Text
        style={[
          styles.text,
          {
            fontSize: sizeConfig.fontSize,
            color: variantConfig.textColor,
          },
          textStyle
        ]}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  icon: {
    marginRight: spacing.xs,
  },
  text: {
    fontWeight: '500',
  },
});