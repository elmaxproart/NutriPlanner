import firestore from '@react-native-firebase/firestore';
import { Menu, Ingredient, MembreFamille } from '../constants/entities';

export class FirestoreService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  private getUserRef() {
    return firestore().collection('users').doc(this.userId);
  }

  async getMenus(): Promise<Menu[]> {
    const snapshot = await this.getUserRef().collection('mymenu').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Menu));
  }

  async getIngredients(): Promise<Ingredient[]> {
    const snapshot = await this.getUserRef().collection('ingredients').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ingredient));
  }

  async getFamilyMembers(): Promise<MembreFamille[]> {
    const snapshot = await this.getUserRef().collection('familyMembers').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MembreFamille));
  }

  async addMenu(menu: Omit<Menu, 'id'>): Promise<void> {
    await this.getUserRef().collection('menus').add(menu);
  }

  async addIngredient(ingredient: Omit<Ingredient, 'id'>): Promise<void> {
    await this.getUserRef().collection('ingredients').add(ingredient);
  }

  async addFamilyMember(member: Omit<MembreFamille, 'id'>): Promise<void> {
    await this.getUserRef().collection('familyMembers').add(member);
  }

  async updateMenu(menuId: string, data: Partial<Menu>): Promise<void> {
    await this.getUserRef().collection('menus').doc(menuId).update(data);
  }

  async deleteMenu(menuId: string): Promise<void> {
    await this.getUserRef().collection('menus').doc(menuId).delete();
  }
}

