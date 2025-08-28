import { ViewStyle, TextStyle, ImageStyle } from 'react-native';

export type StyleProp<T> = T | T[] | undefined;
export type ViewStyleProp = StyleProp<ViewStyle>;
export type TextStyleProp = StyleProp<TextStyle>;
export type ImageStyleProp = StyleProp<ImageStyle>;