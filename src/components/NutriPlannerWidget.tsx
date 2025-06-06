import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, DeviceEventEmitter } from 'react-native';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';

const NutriPlannerWidget: React.FC = () => {
  const [menuData, setMenuData] = useState<{ date: string; menuText: string } | null>(null);

  useEffect(() => {
    console.log('NutriPlannerWidget: Mounting component');

    const subscription = DeviceEventEmitter.addListener('WidgetUpdate', (data: { date: string; menuText: string }) => {
      console.log('NutriPlannerWidget: Received widget update:', data);
      setMenuData(data);
    });

    return () => {
      console.log('NutriPlannerWidget: Unmounting component');
      subscription.remove();
    };
  }, []);

  return (
    <View style={styles.widget}>
      <LinearGradient
        colors={['#4285f4', '#34a853']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Animatable.Text animation="flash" iterationCount="infinite" duration={2000} style={styles.title}>
          NutriPlanner
        </Animatable.Text>
        <Text style={styles.subtitle}>
          {menuData
            ? `Menu du ${menuData.date}: ${menuData.menuText}`
            : 'Menu du jour: Chargement...'}
        </Text>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  widget: {
    borderRadius: 12,
    width: 220,
    elevation: 8,
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    overflow: 'hidden',
    marginVertical: 10,
  },
  gradient: {
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#f0f4ff',
    fontWeight: '400',
  },
});

export default NutriPlannerWidget;
