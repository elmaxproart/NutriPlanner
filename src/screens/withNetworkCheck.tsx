import React from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import NetworkStatusScreen from '../screens/NetworkStatusScreen';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';

type WithNavigationProps<T> = T & {
  navigation: StackNavigationProp<RootStackParamList>;
};

const withNetworkCheck = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
  return (props: WithNavigationProps<P>) => {
    const { isConnected, hasData, isLoading } = useNetworkStatus();


    if (isLoading) {
      return (
        <WrappedComponent {...props} />
      );
    }


    if (!isConnected || !hasData) {
      return (
        <NetworkStatusScreen
          navigation={
            props.navigation as StackNavigationProp<RootStackParamList, 'NetworkStatus'>
          }
        />
      );
    }

    return <WrappedComponent {...props} />;
  };
};

export default withNetworkCheck;
