// @ts-nocheck - Forced IDE refresh
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminGalleryDashboard from './AdminGalleryDashboard';
import AdminGalleryCreateAlbum from './AdminGalleryCreateAlbum';
import AdminGalleryAlbumDetail from './AdminGalleryAlbumDetail';

export type AdminGalleryStackParamList = {
  AdminGalleryDashboard: undefined;
  AdminGalleryCreateAlbum: undefined;
  AdminGalleryAlbumDetail: { albumId: string; albumName: string; albumDescription?: string };
};

const Stack = createNativeStackNavigator<AdminGalleryStackParamList>();

export default function AdminGalleryNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="AdminGalleryDashboard" component={AdminGalleryDashboard} />
      <Stack.Screen 
        name="AdminGalleryCreateAlbum" 
        component={AdminGalleryCreateAlbum} 
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="AdminGalleryAlbumDetail" component={AdminGalleryAlbumDetail} />
    </Stack.Navigator>
  );
}
