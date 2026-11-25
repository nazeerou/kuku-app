
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { docData } from '@angular/fire/firestore';
import {
  Auth,
  authState,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  User
} from '@angular/fire/auth';

import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from '@angular/fire/firestore';

import { Observable } from 'rxjs';
import { UserProfile } from '../models/model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);


currentUser$: Observable<User | null> = authState(this.auth);
  
  // ==========================================
  // CREATE OR SYNCHRONIZE USER PROFILE
  // ==========================================

  getCurrentUserProfile(): Observable<UserProfile | null> {
  return this.currentUser$.pipe(
    switchMap(user => {
      if (!user) {
        return of(null);
      }

      const userRef = doc(this.firestore, 'users', user.uid);

      return docData(userRef, { idField: 'uid' }) as Observable<UserProfile>;
    })
  );
}

  private async ensureUserProfile(
    user: User,
    businessName?: string
  ): Promise<void> {

    if (!user.uid) {
      throw new Error('User UID is missing.');
    }

    const userRef = doc(this.firestore, 'users', user.uid);

    try {
      const snapshot = await getDoc(userRef);

      const existingData = snapshot.exists()
        ? snapshot.data()
        : {};

      const savedBusinessName =
        existingData['businessName'] ||
        businessName?.trim() ||
        user.displayName ||
        'My Poultry Farm';

      await setDoc(
        userRef,
        {
          uid: user.uid,
          email: user.email || '',

          displayName:
            existingData['displayName'] ||
            user.displayName ||
            '',

          businessName: savedBusinessName,

          createdAt:
            existingData['createdAt'] ||
            serverTimestamp(),

          updatedAt: serverTimestamp()

        },
        { merge: true }
      );

      console.log(
        'Firestore profile saved:',
        user.uid
      );

    } catch (error: any) {
      console.error(
        'Firestore Profile Error:',
        error.code,
        error.message
      );

      throw error;
    }
  }

  // ==========================================
  // LOGIN
  // ==========================================

  async login(email: string, password: string) {

    try {
      const credential = await signInWithEmailAndPassword(
        this.auth,
        email.trim(),
        password
      );

      try {
        await this.ensureUserProfile(credential.user);
      } catch (profileError) {
        console.error(
          'Profile synchronization failed:',
          profileError
        );
      }

      await this.router.navigate(['/home']);

      return credential;

    } catch (error) {
      console.error('Login Error:', error);
      throw error;
    }
  }

  // ==========================================
  // REGISTER
  // ==========================================

  async register(
    email: string,
    password: string,
    name: string,
    businessName?: string
  ) {

    try {
      const credential = await createUserWithEmailAndPassword(
        this.auth,
        email.trim(),
        password
      );

      const user = credential.user;

      await updateProfile(user, {
        displayName: name.trim()
      });

      try {
        await this.ensureUserProfile(
          user,
          businessName?.trim() || name.trim()
        );
      } catch (profileError) {
        console.error(
          'Registration profile creation failed:',
          profileError
        );
      }

      await this.router.navigate(['/home']);

      return credential;

    } catch (error) {
      console.error('Registration Error:', error);
      throw error;
    }
  }

  // ==========================================
  // GOOGLE LOGIN
  // ==========================================

  async loginWithGoogle() {

    try {
      const provider = new GoogleAuthProvider();

      provider.setCustomParameters({
        prompt: 'select_account'
      });

      await signInWithRedirect(this.auth, provider);

    } catch (error) {
      console.error('Google Login Error:', error);
      throw error;
    }
  }

  // ==========================================
  // GOOGLE REDIRECT RESULT
  // ==========================================

  async handleRedirectResult() {

    try {
      const result = await getRedirectResult(this.auth);

      if (result?.user) {

        try {
          await this.ensureUserProfile(result.user);
        } catch (profileError) {
          console.error(
            'Google profile synchronization failed:',
            profileError
          );
        }

        await this.router.navigate(['/home']);
      }

      return result;

    } catch (error) {
      console.error('Google Redirect Error:', error);
      throw error;
    }
  }

  // ==========================================
  // UPDATE USER PROFILE
  // ==========================================

  async updateUserProfile(
    uid: string,
    data: Partial<UserProfile>
  ): Promise<void> {

    if (!uid) {
      throw new Error('User UID is required.');
    }

    try {
      const userRef = doc(this.firestore, 'users', uid);

      await setDoc(
        userRef,
        {
          ...data,
          uid,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );

      console.log('Profile updated successfully:', uid);

    } catch (error) {
      console.error('Profile Update Error:', error);
      throw error;
    }
  }

  // ==========================================
  // LOGOUT
  // ==========================================

  async logout() {

    try {
      await signOut(this.auth);

      await this.router.navigate(['/login']);

    } catch (error) {
      console.error('Logout Error:', error);
      throw error;
    }
  }
}
