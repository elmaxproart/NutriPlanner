import { StyleSheet, Platform, Dimensions } from 'react-native';
import { theme } from './theme';

const { width: screenWidth } = Dimensions.get('window');

export const commonStyles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: Platform.OS === 'ios' ? theme.spacing.xxl : theme.spacing.lg,
  },
  sectionContainer: {
    marginVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },


  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingTop: Platform.OS === 'ios' ? theme.spacing.xxl + 20 : theme.spacing.lg,
    backgroundColor: theme.colors.background,
    elevation: theme.elevation.medium,
    shadowColor: theme.shadow.color,
    shadowOffset: theme.shadow.offset,
    shadowOpacity: theme.shadow.opacity,
    shadowRadius: theme.shadow.radius,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionHeaderTitle: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.bold,
    fontSize: theme.fonts.sizes.title,
    letterSpacing: 0.8,
  },

  // Cartes
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.lg,
    marginVertical: theme.spacing.sm,
    marginHorizontal: theme.spacing.xs,
    elevation: theme.elevation.medium,
    shadowColor: theme.shadow.color,
    shadowOffset: theme.shadow.offset,
    shadowOpacity: theme.shadow.opacity,
    shadowRadius: theme.shadow.radius,
  },
  carouselCard: {
    width: screenWidth * 0.6,
    borderRadius: theme.borderRadius.large,
    overflow: 'hidden',
    marginHorizontal: theme.spacing.sm,
    elevation: theme.elevation.high,
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: theme.borderRadius.medium,
  },
  cardGradient: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.large,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    color: theme.colors.white,
    fontFamily: theme.fonts.bold,
    fontSize: theme.fonts.sizes.medium,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  cardDescription: {
    color: '#26A69A',
    fontFamily: theme.fonts.regular,
    fontSize: theme.fonts.sizes.small,
    textAlign: 'left',
    lineHeight: 18,
  },

  // Boutons
  button: {
    borderRadius: theme.borderRadius.medium,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    elevation: theme.elevation.low,
    shadowColor: theme.shadow.color,
    shadowOffset: theme.shadow.offset,
    shadowOpacity: theme.shadow.opacity,
    shadowRadius: theme.shadow.radius,
  },
  buttonGradient: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonText: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.bold,
    fontSize: theme.fonts.sizes.medium,
  },
  iconButton: {
    borderRadius: theme.borderRadius.round,
    padding: theme.spacing.sm,
    overflow: 'hidden',
  },
  iconButtonGradient: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seeMoreButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  seeMoreText: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fonts.sizes.medium,
    fontWeight: '600',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xlarge,
    padding: theme.spacing.xl,
    elevation: theme.elevation.high,
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: theme.borderRadius.large,
  },
  modalHeaderTitle: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.bold,
    fontSize: theme.fonts.sizes.headline,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
    letterSpacing: 1.2,
  },
  closeModalButton: {
    alignSelf: 'flex-end',
    padding: theme.spacing.sm,
  },

  // Listes
  horizontalListContent: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
  },
  verticalListContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },

  // Champs de saisie
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: theme.colors.textPrimary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    fontFamily: theme.fonts.regular,
    fontSize: theme.fonts.sizes.medium,
    marginVertical: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: theme.colors.textPrimary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    fontSize: theme.fonts.sizes.medium,
    marginRight: theme.spacing.sm,
  },

  // Textes
  text: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.regular,
    fontSize: theme.fonts.sizes.medium,
    lineHeight: 22,
  },
  textSecondary: {
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.regular,
    fontSize: theme.fonts.sizes.small,
    lineHeight: 18,
  },
  textBold: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.bold,
    fontSize: theme.fonts.sizes.medium,
  },
  title: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.bold,
    fontSize: theme.fonts.sizes.title,
    letterSpacing: 0.8,
  },
  headline: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.bold,
    fontSize: theme.fonts.sizes.headline,
    letterSpacing: 1.2,
  },

  // Chargement
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  loadingText: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.bold,
    fontSize: theme.fonts.sizes.large,
    marginTop: theme.spacing.md,
  },

  // Menu latéral
  sideMenuContainer: {
    width: screenWidth * 0.75,
    height: '100%',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    paddingTop: Platform.OS === 'ios' ? theme.spacing.xxl + 20 : theme.spacing.xl,
    elevation: theme.elevation.high,
    shadowColor: theme.shadow.color,
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: theme.borderRadius.large,
  },
  sideMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    marginVertical: theme.spacing.xs,
  },
  sideMenuText: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fonts.sizes.medium,
    marginLeft: theme.spacing.sm,
  },

  // Bouton principal
  mainActionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.OS === 'ios' ? theme.spacing.xl : theme.spacing.md,
  },
  mainActionGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: theme.elevation.high,
  },
});
