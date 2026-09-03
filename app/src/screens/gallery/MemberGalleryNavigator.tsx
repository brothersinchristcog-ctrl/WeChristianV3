import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MemberGalleryDashboard from './MemberGalleryDashboard';
import MemberGalleryAlbumDetail from './MemberGalleryAlbumDetail';

export type MemberGalleryStackParamList = {
  MemberGalleryDashboard: undefined;
  MemberGalleryAlbumDetail: { albumId: string; albumName: string; albumDescription?: string };
};

const Stack = createNativeStackNavigator<MemberGalleryStackParamList>();

export default function MemberGalleryNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="MemberGalleryDashboard" component={MemberGalleryDashboard} />
      <Stack.Screen name="MemberGalleryAlbumDetail" component={MemberGalleryAlbumDetail} />
    </Stack.Navigator>
  );
}
