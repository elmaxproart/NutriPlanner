import React from 'react';
import { View } from 'react-native';
import { GradientButton } from '../common/GradientButton';
import { styles } from '../../styles/onboardingStyle';

interface OnboardingNavigationProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onFinish: () => void;
  onSkip?: () => void;
}

export const OnboardingNavigation = ({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onFinish,
  onSkip,
}: OnboardingNavigationProps) => {
  return (
    <View style={styles.navigationContainer}>
      {currentStep > 0 && (
        <GradientButton
          title="Précédent"
          onPress={onPrevious}
          // eslint-disable-next-line react-native/no-inline-styles
          style={[styles.detailButton, { flex: 1, marginRight: 5 }]}
          textStyle={styles.detailButtonText}
        />
      )}
      <GradientButton
        title={currentStep === totalSteps - 1 ? 'Terminer' : 'Suivant'}
        onPress={currentStep === totalSteps - 1 ? onFinish : onNext}
        // eslint-disable-next-line react-native/no-inline-styles
        style={[styles.saveButton, { flex: currentStep > 0 ? 1 : 2, marginLeft: currentStep > 0 ? 5 : 0 }]}
        textStyle={styles.detailButtonText}
      />
      {onSkip && currentStep < totalSteps - 1 && (
        <GradientButton
          title="Passer"
          onPress={onSkip}
          // eslint-disable-next-line react-native/no-inline-styles
          style={[styles.skipButton, { flex: 1, marginLeft: 5 }]}
          textStyle={styles.skipButtonText}
        />
      )}
    </View>
  );
};
