import { colors, spacing } from '../theme/colors'

export const commonToolStyles = {
  container: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing.xs,
    marginHorizontal: -spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background.primary,
  },
  headerContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: spacing.sm,
  },
  headerInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.text.primary,
  },
  preview: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 2,
  },
  statusIndicator: {
    marginRight: spacing.xs,
  },
  chevron: {
    marginLeft: spacing.xs,
  },
}

export const errorStyles = {
  errorIndicator: {
    opacity: 1,
  },
  errorMessage: {
    fontSize: 12,
    color: colors.semantic.error,
    marginLeft: 32,
    marginTop: spacing.xs,
    padding: spacing.sm,
    backgroundColor: 'rgba(244, 135, 113, 0.1)',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: colors.semantic.error,
  },
  errorText: {
    fontSize: 12,
    color: colors.semantic.error,
    padding: spacing.sm,
    backgroundColor: 'rgba(244, 135, 113, 0.1)',
    borderRadius: 4,
  },
  errorContainer: {
    backgroundColor: 'rgba(244, 135, 113, 0.1)',
    borderRadius: 4,
    padding: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.semantic.error,
  },
  errorHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.xs,
  },
  errorLabel: {
    fontSize: 12,
    color: colors.semantic.error,
    fontWeight: '600' as const,
    marginLeft: spacing.xs,
    textTransform: 'uppercase' as const,
  },
}

export const terminalStyles = {
  terminalContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    marginTop: spacing.xs,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  terminalContent: {
    padding: spacing.sm,
  },
  commandLine: {
    flexDirection: 'row' as const,
    backgroundColor: colors.background.tertiary,
    padding: spacing.sm,
    borderRadius: 4,
    marginBottom: spacing.sm,
  },
  prompt: {
    fontSize: 12,
    color: colors.text.secondary,
    fontFamily: 'monospace',
    marginRight: spacing.xs,
  },
  command: {
    fontSize: 12,
    color: colors.text.primary,
    fontFamily: 'monospace',
    flex: 1,
    fontWeight: '500' as const,
  },
  outputContainer: {
    maxHeight: 400,
    paddingHorizontal: spacing.xs,
  },
  output: {
    fontSize: 12,
    color: colors.text.secondary,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  errorOutput: {
    color: '#ff6b6b',
  },
  terminalError: {
    marginBottom: spacing.sm,
    padding: spacing.sm,
    backgroundColor: 'rgba(244, 135, 113, 0.15)',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: colors.semantic.error,
  },
  terminalErrorLabel: {
    fontSize: 11,
    color: colors.semantic.error,
    fontWeight: '600' as const,
    marginBottom: spacing.xs,
    textTransform: 'uppercase' as const,
  },
}