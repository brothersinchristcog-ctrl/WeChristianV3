import { Linking, Platform } from 'react-native';

export const openInMaps = (lat: number, lng: number, label: string, address?: string) => {
  if (address && address.trim().length > 0) {
    const url = Platform.select({
      ios: `maps://?q=${encodeURIComponent(address)}`,
      android: `geo:0,0?q=${encodeURIComponent(address)}`,
    });
    Linking.openURL(url!);
    return;
  }

  const url = Platform.select({
    ios:     `maps://?q=${label}&ll=${lat},${lng}`,
    android: `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(label)})`,
  });
  Linking.openURL(url!);
};

export const openRoute = (waypoints: { lat: number; lng: number }[]) => {
  const coords = waypoints.map(w => `${w.lat},${w.lng}`).join('/');
  Linking.openURL(`https://www.google.com/maps/dir/${coords}`);
};
