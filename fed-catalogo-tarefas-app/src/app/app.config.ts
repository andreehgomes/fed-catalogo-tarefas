import {
  ApplicationConfig,
  EnvironmentProviders,
  Provider,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import {
  ReCaptchaV3Provider,
  initializeAppCheck,
  provideAppCheck,
} from '@angular/fire/app-check';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getFunctions, provideFunctions } from '@angular/fire/functions';

import { routes } from './app.routes';
import { firebaseConfig, recaptchaSiteKey } from '../environments/firebase-config';

const FUNCTIONS_REGION = 'us-central1';

function buildAppCheckProvider(): EnvironmentProviders | null {
  const siteKey = recaptchaSiteKey;
  if (!siteKey) {
    return null;
  }
  return provideAppCheck(() =>
    initializeAppCheck(undefined, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true,
    }),
  );
}

const baseProviders: (Provider | EnvironmentProviders)[] = [
  provideBrowserGlobalErrorListeners(),
  provideZoneChangeDetection({ eventCoalescing: true }),
  provideRouter(routes),
  provideFirebaseApp(() => initializeApp(firebaseConfig)),
  provideAuth(() => getAuth()),
  provideFirestore(() => getFirestore()),
  provideFunctions(() => getFunctions(undefined, FUNCTIONS_REGION)),
];

const appCheck = buildAppCheckProvider();

export const appConfig: ApplicationConfig = {
  providers: appCheck ? [...baseProviders, appCheck] : baseProviders,
};
