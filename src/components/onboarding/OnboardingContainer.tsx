import React, { useState, ReactNode, useEffect } from 'react';
import { View, ScrollView, Text } from 'react-native';
import { StepIndicator } from './StepIndicator';
import { WelcomeCard } from './WelcomeCard';
import { OnboardingNavigation } from './OnboardingNavigation';
import { styles } from '../../styles/onboardingStyle';
import { Easing, useSharedValue, withTiming } from 'react-native-reanimated';
import { ProgressBar } from '../common/ProgressBar';

interface OnboardingContainerProps {
  children: ReactNode[];
  onFinish: () => void;
  onSkip?: () => void;
  initialStep?: number;
  showWelcomeCard?: boolean;
}

export const OnboardingContainer = ({
  children,
  onFinish,
  onSkip,
  initialStep = 0,
  showWelcomeCard = true,
}: OnboardingContainerProps) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const totalSteps = children.length;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming((currentStep + 1) / totalSteps, { duration: 500, easing: Easing.ease });
  }, [currentStep, progress, totalSteps]);


  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onFinish();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };



  return (
    <View style={styles.container}>
      {showWelcomeCard && (
        <WelcomeCard
          title="Bienvenue dans NutriPlanner"
          description="Configurez votre famille pour une planification alimentaire personnalisée."
        />
      )}
      <View style={styles.formContain}>
        <Text style={styles.headerTitle}>Étape {currentStep + 1} sur {totalSteps}</Text>
        <ProgressBar progress={progress.value} animated={true} />
        <StepIndicator currentStep={currentStep} totalSteps={totalSteps} onStepPress={setCurrentStep} />
        <ScrollView contentContainerStyle={styles.stepContainer}>
          {children[currentStep]}
        </ScrollView>
      </View>
      <OnboardingNavigation
        currentStep={currentStep}
        totalSteps={totalSteps}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onFinish={onFinish}
        onSkip={onSkip}
      />
    </View>
  );
};
