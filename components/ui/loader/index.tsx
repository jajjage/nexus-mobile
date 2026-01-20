import { Center } from '@/components/ui/center';
import { Image } from '@/components/ui/image';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface LoaderProps {
  /** Size of the loader - 'sm' (48px), 'md' (64px), 'lg' (80px) */
  size?: 'sm' | 'md' | 'lg';
  /** Text to show below the loader */
  text?: string;
  /** Whether to show the logo in the center */
  showLogo?: boolean;
  /** Whether to take full screen */
  fullScreen?: boolean;
}

const SIZES = {
  sm: { container: 48, logo: 18, stroke: 2, radius: 20 },
  md: { container: 64, logo: 24, stroke: 2.5, radius: 27 },
  lg: { container: 80, logo: 30, stroke: 3, radius: 34 },
};

export function Loader({
  size = 'md',
  text = 'Loading...',
  showLogo = true,
  fullScreen = false,
}: LoaderProps) {
  const spinValue = useRef(new Animated.Value(0)).current;
  const sizeConfig = SIZES[size];
  
  // Circumference of the circle
  const circumference = 2 * Math.PI * sizeConfig.radius;
  
  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    
    return () => animation.stop();
  }, [spinValue]);

  const rotate = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const content = (
    <VStack space="sm" className="items-center">
      <View style={[styles.container, { width: sizeConfig.container, height: sizeConfig.container }]}>
        {/* Spinning arc */}
        <Animated.View
          style={[
            styles.spinnerContainer,
            { transform: [{ rotate }] },
            { width: sizeConfig.container, height: sizeConfig.container },
          ]}
        >
          <Svg width={sizeConfig.container} height={sizeConfig.container}>
            {/* Background circle (light gray) */}
            <Circle
              cx={sizeConfig.container / 2}
              cy={sizeConfig.container / 2}
              r={sizeConfig.radius}
              stroke="#E5E7EB"
              strokeWidth={sizeConfig.stroke}
              fill="none"
            />
            {/* Animated arc (primary gold color) */}
            <Circle
              cx={sizeConfig.container / 2}
              cy={sizeConfig.container / 2}
              r={sizeConfig.radius}
              stroke="#E69E19"
              strokeWidth={sizeConfig.stroke}
              fill="none"
              strokeDasharray={`${circumference * 0.7} ${circumference * 0.3}`}
              strokeLinecap="round"
            />
          </Svg>
        </Animated.View>
        
        {/* Center logo */}
        {showLogo && (
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={{ width: sizeConfig.logo, height: sizeConfig.logo }}
              alt="Logo"
              resizeMode="contain"
            />
          </View>
        )}
      </View>
      
      {text && (
        <Text className="text-typography-500 text-sm">{text}</Text>
      )}
    </VStack>
  );

  if (fullScreen) {
    return (
      <Center className="flex-1 bg-background-50">
        {content}
      </Center>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  spinnerContainer: {
    position: 'absolute',
  },
  logoContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Loader;
