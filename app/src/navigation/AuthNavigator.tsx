import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import VerifyOtpScreen from '../screens/auth/VerifyOtpScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import RegistrationSuccessScreen from '../screens/auth/RegistrationSuccessScreen';
import ChurchSelectionScreen from '../screens/auth/ChurchSelectionScreen';
import CreateChurchScreen from '../screens/auth/CreateChurchScreen';
import JoinSuccessScreen from '../screens/auth/JoinSuccessScreen';
import Theme from '../theme/Theme';

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  RegistrationSuccess: undefined;
  VerifyOtp: { confirmation: any; phoneNumber: string; contactId?: string; memberName?: string; formData?: any; isSignUp?: boolean };
  ChurchSelection: undefined;
  CreateChurch: undefined;
  JoinSuccess: { churchName: string; isNewChurch?: boolean; churchCode?: string };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

import { useChurch } from '../context/ChurchContext';

export default function AuthNavigator() {
  const { churchId } = useChurch();

  return (
    <Stack.Navigator
      initialRouteName={churchId ? "Login" : "ChurchSelection"}
      screenOptions={{
        headerStyle: { backgroundColor: Theme.Colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SignUp"
        component={SignUpScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RegistrationSuccess"
        component={RegistrationSuccessScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="VerifyOtp"
        component={VerifyOtpScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ChurchSelection"
        component={ChurchSelectionScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateChurch"
        component={CreateChurchScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="JoinSuccess"
        component={JoinSuccessScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}
