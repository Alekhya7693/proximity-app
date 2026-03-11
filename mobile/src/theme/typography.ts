import { TextStyle } from 'react-native';

export const fontWeights = {
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semibold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
};

export const typography = {
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: fontWeights.bold,
  } as TextStyle,
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: fontWeights.bold,
  } as TextStyle,
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: fontWeights.semibold,
  } as TextStyle,
  h4: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: fontWeights.semibold,
  } as TextStyle,
  subtitle1: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: fontWeights.medium,
  } as TextStyle,
  subtitle2: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: fontWeights.medium,
  } as TextStyle,
  body1: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: fontWeights.regular,
  } as TextStyle,
  body2: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: fontWeights.regular,
  } as TextStyle,
  caption: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: fontWeights.regular,
  } as TextStyle,
  overline: {
    fontSize: 10,
    lineHeight: 16,
    fontWeight: fontWeights.medium,
    textTransform: 'uppercase' as TextStyle['textTransform'],
    letterSpacing: 1.5,
  } as TextStyle,
  button: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: fontWeights.semibold,
  } as TextStyle,
  buttonSmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: fontWeights.medium,
  } as TextStyle,
};
