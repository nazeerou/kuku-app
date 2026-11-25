
import { ApplicationConfig, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

import {
  FirebaseApp,
  initializeApp,
  provideFirebaseApp
} from '@angular/fire/app';

import {
  Auth,
  getAuth,
  provideAuth
} from '@angular/fire/auth';

import {
  Firestore,
  getFirestore,
  provideFirestore
} from '@angular/fire/firestore';

import {
  Storage,
  getStorage,
  provideStorage
} from '@angular/fire/storage';

import { environment } from '../environment/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),

    provideFirebaseApp(() =>
      initializeApp(environment.firebase)
    ),

    provideAuth(() => {
      const app = inject(FirebaseApp);
      return getAuth(app);
    }),

    provideFirestore(() => {
      const app = inject(FirebaseApp);
      return getFirestore(app);
    }),

    provideStorage(() => {
      const app = inject(FirebaseApp);
      return getStorage(app);
    })
  ]
};
