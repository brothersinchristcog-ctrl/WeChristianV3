import { firestore, storage, FieldValue } from './firebaseConfig';
import FirestoreService from './FirestoreService';

export interface GalleryAlbum {
  id: string;
  name: string;
  description?: string;
  coverPhotoUrl?: string;
  photoCount?: number;
  visibility?: string;
  createdAt?: any;
  date?: string;
}

export interface GalleryPhoto {
  id: string;
  url: string;
  uploadedBy?: string;
  createdAt?: any;
}

class GalleryService {
  private async getChurchId(): Promise<string> {
    const churchId = await FirestoreService.getChurchId();
    if (!churchId) throw new Error("No church context found.");
    return churchId;
  }

  async getAlbums(): Promise<GalleryAlbum[]> {
    const churchId = await this.getChurchId();
    const snapshot = await firestore()
      .collection('churches')
      .doc(churchId)
      .collection('gallery_albums')
      .orderBy('createdAt', 'desc')
      .get();
      
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryAlbum));
  }

  async createAlbum(albumData: Partial<GalleryAlbum>, coverUri?: string): Promise<void> {
    const churchId = await this.getChurchId();
    
    let coverPhotoUrl = '';
    if (coverUri) {
      // Upload cover photo to storage
      const filename = `cover_${Date.now()}.jpg`;
      const storageRef = storage().ref(`churches/${churchId}/gallery_covers/${filename}`);
      await storageRef.putFile(coverUri);
      coverPhotoUrl = await storageRef.getDownloadURL();
    }
    
    await firestore()
      .collection('churches')
      .doc(churchId)
      .collection('gallery_albums')
      .add({
        ...albumData,
        coverPhotoUrl,
        photoCount: 0,
        createdAt: FieldValue.serverTimestamp(),
      });
  }
  
  async getAlbumPhotos(albumId: string): Promise<GalleryPhoto[]> {
    const churchId = await this.getChurchId();
    const snapshot = await firestore()
      .collection('churches')
      .doc(churchId)
      .collection('gallery_albums')
      .doc(albumId)
      .collection('photos')
      .orderBy('createdAt', 'desc')
      .get();
      
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryPhoto));
  }
  
  async uploadPhotosToAlbum(albumId: string, uris: string[], uploadedBy: string): Promise<void> {
    const churchId = await this.getChurchId();
    
    const albumRef = firestore()
      .collection('churches')
      .doc(churchId)
      .collection('gallery_albums')
      .doc(albumId);
      
    let uploadedCount = 0;
    
    // Upload each file
    for (const uri of uris) {
      try {
        const filename = `photo_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
        const storageRef = storage().ref(`churches/${churchId}/gallery/${albumId}/${filename}`);
        await storageRef.putFile(uri);
        const url = await storageRef.getDownloadURL();
        
        await albumRef.collection('photos').add({
          url,
          uploadedBy,
          createdAt: FieldValue.serverTimestamp()
        });
        
        uploadedCount++;
      } catch (err) {
        console.error("Failed to upload photo:", err);
      }
    }
    
    // Update photo count
    if (uploadedCount > 0) {
      await albumRef.update({
        photoCount: FieldValue.increment(uploadedCount)
      });
    }
  }
  
  async deletePhoto(photoId: string, albumId: string, photoUrl: string): Promise<void> {
    const churchId = await this.getChurchId();
    
    // Delete from firestore
    const albumRef = firestore()
      .collection('churches')
      .doc(churchId)
      .collection('gallery_albums')
      .doc(albumId);
      
    await albumRef.collection('photos').doc(photoId).delete();
    
    // Update count
    await albumRef.update({
      photoCount: FieldValue.increment(-1)
    });
    
    // Delete from storage
    try {
      const storageRef = storage().refFromURL(photoUrl);
      await storageRef.delete();
    } catch (e) {
      console.log("Could not delete from storage, might already be deleted", e);
    }
  }
  
  async deleteAlbum(albumId: string, coverPhotoUrl?: string): Promise<void> {
    const churchId = await this.getChurchId();
    
    const albumRef = firestore()
      .collection('churches')
      .doc(churchId)
      .collection('gallery_albums')
      .doc(albumId);
      
    // Delete all photos inside
    const photosSnapshot = await albumRef.collection('photos').get();
    
    for (const doc of photosSnapshot.docs) {
      const data = doc.data() as GalleryPhoto;
      if (data.url) {
        try {
          const storageRef = storage().refFromURL(data.url);
          await storageRef.delete();
        } catch (e) {}
      }
      await doc.ref.delete();
    }
    
    // Delete cover photo if exists
    if (coverPhotoUrl) {
      try {
        const storageRef = storage().refFromURL(coverPhotoUrl);
        await storageRef.delete();
      } catch (e) {}
    }
    
    // Delete album doc
    await albumRef.delete();
  }
}

export default new GalleryService();
