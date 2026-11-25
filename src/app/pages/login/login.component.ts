
import {
  Component,
  inject,
  CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],

  template: `
    <div class="mobile-app-container">

      <!-- BRAND HEADER -->
      <div class="brand-header">

        <!-- Decorative Poultry Background -->
        <div class="poultry-decoration decoration-left">
          <span>🐥</span>
          <span>🐓</span>
        </div>

        <div class="poultry-decoration decoration-right">
          <span>🐔</span>
          <span>🐣</span>
        </div>

        <div class="poultry-decoration decoration-bottom">
          <span>🐓</span>
          <span>🐔</span>
          <span>🐥</span>
        </div>

        <!-- Poultry Logo -->
        <div class="logo-circle">
          <svg
            class="poultry-logo"
            viewBox="0 0 64 64"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="LIVORA poultry logo">

            <!-- Body -->
            <path
              d="M13 39 C13 28 22 20 34 21
                 C43 21 49 27 50 35
                 C51 44 43 51 31 51 H22
                 C16 51 12 46 13 39Z"
              fill="white"/>

            <!-- Tail -->
            <path
              d="M15 35 C7 31 7 25 11 21
                 C15 24 18 27 20 32Z"
              fill="white"/>

            <!-- Neck -->
            <path
              d="M40 29 C39 19 42 13 49 11
                 C56 10 58 16 55 21
                 C53 25 49 27 48 33Z"
              fill="white"/>

            <!-- Comb -->
            <path
              d="M45 13 C42 7 46 4 49 9
                 C51 3 56 5 55 12
                 C60 8 62 14 56 18Z"
              fill="#FF6B6B"/>

            <!-- Beak -->
            <path
              d="M55 20 L63 23 L55 26Z"
              fill="#FFC857"/>

            <!-- Eye -->
            <circle
              cx="51"
              cy="18"
              r="1.8"
              fill="#473080"/>

            <!-- Wing -->
            <path
              d="M23 35 C29 28 40 30 43 38
                 C39 46 27 46 23 35Z"
              fill="#E8DDFF"/>

            <!-- Legs -->
            <path
              d="M27 50 V56 M39 50 V56
                 M23 56 H30 M35 56 H43"
              stroke="white"
              stroke-width="2.5"
              stroke-linecap="round"
              fill="none"/>
          </svg>
        </div>

        <h1>LAYORA</h1>

        <p class="brand-subtitle">
          Poultry Farming Management
        </p>

        <span class="brand-tagline">
          Smart Farming. Better Production.
        </span>

      </div>

      <!-- FORM SHEET -->
      <div class="form-sheet">

        <div class="form-heading">
          <h2>
            {{ isRegister ? 'Create Account' : 'Welcome' }}
          </h2>

          <p class="subtitle">
            {{
              isRegister
                ? 'Sign up to manage your poultry business'
                : 'Login to your account to continue'
            }}
          </p>
        </div>

        <form
          [formGroup]="loginForm"
          (ngSubmit)="onSubmit()"
          novalidate>

          <!-- NAME -->
          <div class="input-group" *ngIf="isRegister">

            <label>Full Name</label>

            <div class="input-wrapper">
              <ion-icon
                name="person-outline"
                class="input-icon">
              </ion-icon>

              <input
                type="text"
                formControlName="name"
                placeholder="Enter your full name"
                autocomplete="name"/>
            </div>

            <small
              class="field-error"
              *ngIf="
                loginForm.get('name')?.touched &&
                loginForm.get('name')?.invalid
              ">
              Please enter your name.
            </small>

          </div>

          <!-- EMAIL -->
          <div class="input-group">

            <label>Email Address</label>

            <div class="input-wrapper">
              <ion-icon
                name="mail-outline"
                class="input-icon">
              </ion-icon>

              <input
                type="email"
                formControlName="email"
                placeholder="Enter Email Address"
                autocomplete="email"/>
            </div>

            <small
              class="field-error"
              *ngIf="
                loginForm.get('email')?.touched &&
                loginForm.get('email')?.invalid
              ">
              Please enter a valid email address.
            </small>

          </div>

          <!-- PASSWORD -->
          <div class="input-group">

            <label>Password</label>

            <div class="password-wrapper">

              <ion-icon
                name="lock-closed-outline"
                class="input-icon">
              </ion-icon>

              <input
                [type]="showPassword ? 'text' : 'password'"
                formControlName="password"
                placeholder="Enter your password"
                autocomplete="current-password"/>

              <button
                type="button"
                class="toggle-btn"
                (click)="showPassword = !showPassword"
                [attr.aria-label]="
                  showPassword ? 'Hide password' : 'Show password'
                ">

                <ion-icon
                  [name]="
                    showPassword ? 'eye-off-outline' : 'eye-outline'
                  ">
                </ion-icon>

              </button>

            </div>

            <small
              class="field-error"
              *ngIf="
                loginForm.get('password')?.touched &&
                loginForm.get('password')?.invalid
              ">
              Password must contain at least 6 characters.
            </small>

          </div>

          <!-- ERROR MESSAGE -->
          <div
            *ngIf="errorMsg"
            class="error-msg"
            role="alert"
            aria-live="polite">

            <ion-icon name="alert-circle-outline"></ion-icon>
            <span>{{ errorMsg }}</span>

          </div>

          <!-- PRIMARY BUTTON -->
          <button
            type="submit"
            class="btn-mobile-primary"
            [disabled]="loginForm.invalid || isLoading">

            <ion-icon
              *ngIf="!isLoading"
              [name]="
                isRegister ? 'person-add-outline' : 'log-in-outline'
              ">
            </ion-icon>

            <span>
              {{
                isLoading
                  ? 'Please wait...'
                  : (isRegister ? 'Create Account' : 'Login')
              }}
            </span>

            <ion-icon
              *ngIf="!isLoading"
              name="arrow-forward-outline">
            </ion-icon>

          </button>

        </form>

        <!-- DIVIDER -->
        <div class="divider">
          <span>OR</span>
        </div>

        <!-- BIOMETRIC LOGIN -->
        <button
          type="button"
          class="btn-biometric"
          (click)="loginWithBiometric()"
          [disabled]="isLoading || isRegister">

          <ion-icon
            name="finger-print-outline"
            class="fingerprint-icon">
          </ion-icon>

          <span class="biometric-text">
            <strong>Login with Biometrics</strong>
            <small>Use fingerprint or device authentication</small>
          </span>

          <ion-icon
            name="chevron-forward-outline"
            class="biometric-arrow">
          </ion-icon>

        </button>

        <!-- TOGGLE AUTH -->
        <p class="toggle-auth">

          {{
            isRegister
              ? 'Already have an account?'
              : "Don't have an account?"
          }}

          <span (click)="toggleAuth()">
            {{ isRegister ? 'Login' : 'Register' }}
          </span>

        </p>

        <!-- FOOTER -->
        <div class="form-footer">
          <span>Powered by Manani Tech</span>
        </div>

      </div>

    </div>
  `,

  styles: [`

    :host {
      display: block;
      min-height: 100%;
    }

    * {
      box-sizing: border-box;
    }

    /* MAIN CONTAINER */

    .mobile-app-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      min-height: 100dvh;
      width: 100%;
      background: #7047F5;
      font-family:
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        Roboto,
        Helvetica,
        Arial,
        sans-serif;
      overflow: hidden;
    }

    /* BRAND HEADER */

    .brand-header {
      position: relative;
      isolation: isolate;
      overflow: hidden;
      text-align: center;
      color: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 16px 36px;
      background:
        radial-gradient(
          circle at 15% 15%,
          rgba(255,255,255,.17),
          transparent 35%
        ),
        radial-gradient(
          circle at 90% 80%,
          rgba(255,255,255,.13),
          transparent 35%
        ),
        linear-gradient(
          135deg,
          #7650F5,
          #6038D6,
          #4D2DBB
        );
    }

    .brand-header::before,
    .brand-header::after {
      content: '';
      position: absolute;
      z-index: -1;
      border: 1px solid rgba(255,255,255,.10);
      border-radius: 50%;
      pointer-events: none;
    }

    .brand-header::before {
      width: 230px;
      height: 230px;
      top: -130px;
      right: -65px;
    }

    .brand-header::after {
      width: 180px;
      height: 180px;
      bottom: -125px;
      left: -65px;
    }

    /* POULTRY DECORATION */

    .poultry-decoration {
      position: absolute;
      z-index: -1;
      display: flex;
      align-items: center;
      gap: 12px;
      pointer-events: none;
      user-select: none;
      filter: grayscale(1);
      opacity: .18;
    }

    .poultry-decoration span {
      font-size: 39px;
    }

    .decoration-left {
      top: 12px;
      left: -5px;
      transform: rotate(-16deg);
    }

    .decoration-right {
      top: 15px;
      right: -5px;
      transform: rotate(13deg);
    }

    .decoration-bottom {
      bottom: 10px;
      right: 12%;
      opacity: .12;
      transform: rotate(-8deg);
    }

    .decoration-bottom span {
      font-size: 29px;
    }

    /* POULTRY LOGO */

    .logo-circle {
      width: 65px;
      height: 65px;
      background: rgba(255,255,255,.19);
      border: 1px solid rgba(255,255,255,.30);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 10px;
      backdrop-filter: blur(10px);
      box-shadow: 0 7px 20px rgba(35,15,100,.15);
    }

    .poultry-logo {
      width: 43px;
      height: 43px;
      display: block;
    }

    .brand-header h1 {
      font-size: 30px;
      font-weight: 800;
      letter-spacing: 3px;
      margin: 0 0 5px;
      color: white;
    }

    .brand-subtitle {
      font-size: 12px;
      color: rgba(255,255,255,.88);
      margin: 0;
      font-weight: 500;
      letter-spacing: .4px;
    }

    .brand-tagline {
      display: inline-block;
      margin-top: 4px;
      font-size: 9px;
      font-style: italic;
      color: rgba(255,255,255,.68);
      letter-spacing: .7px;
    }

    /* FORM SHEET */

    .form-sheet {
      position: relative;
      background: #fff;
      flex: 1;
      width: 100%;
      border-top-left-radius: 27px;
      border-top-right-radius: 27px;
      padding: 27px 21px 18px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 -5px 25px rgba(0,0,0,.10);
    }

    .form-heading h2 {
      font-size: 23px;
      color: #302B40;
      font-weight: 750;
      margin: 0 0 6px;
    }

    .form-sheet .subtitle {
      font-size: 12px;
      color: #898598;
      margin: 0 0 23px;
      line-height: 1.5;
    }

    /* INPUTS */

    .input-group {
      margin-bottom: 17px;
    }

    .input-group label {
      display: block;
      font-size: 12px;
      font-weight: 650;
      color: #514C60;
      margin-bottom: 7px;
    }

    .input-wrapper,
    .password-wrapper {
      width: 100%;
      min-height: 49px;
      display: flex;
      align-items: center;
      gap: 11px;
      padding: 0 13px;
      background: #F6F5FA;
      border: 1px solid #d9cff8;
      border-radius: 12px;
      transition: all .25s ease;
    }

    .input-wrapper:focus-within,
    .password-wrapper:focus-within {
      background: #fff;
      border-color: #7047F5;
      box-shadow: 0 0 0 3px rgba(112,71,245,.10);
    }

    .input-icon {
      font-size: 19px;
      color: #9187AA;
      flex-shrink: 0;
    }

    .input-wrapper input,
    .password-wrapper input {
      width: 100%;
      min-width: 0;
      height: 46px;
      padding: 0;
      background: transparent;
      border: none;
      outline: none;
      box-shadow: none;
      font-size: 14px;
      color: #333;
      font-family: inherit;
    }

    .input-wrapper input:focus,
    .password-wrapper input:focus {
      border: none;
      outline: none;
      box-shadow: none;
    }

    .input-wrapper input::placeholder,
    .password-wrapper input::placeholder {
      color: #AAA6B4;
    }

    .password-wrapper {
      position: relative;
    }

    .toggle-btn {
      background: transparent;
      border: none;
      color: #9187AA;
      font-size: 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 6px;
      flex-shrink: 0;
    }

    .toggle-btn:active {
      color: #7047F5;
    }

    .field-error {
      display: block;
      color: #D64545;
      font-size: 10px;
      margin-top: 5px;
    }

    /* ERROR MESSAGE */

    .error-msg {
      background: #FFF0F0;
      color: #D32F2F;
      border: 1px solid #FFDADA;
      padding: 11px 12px;
      border-radius: 10px;
      font-size: 12px;
      margin-bottom: 14px;
      display: flex;
      align-items: flex-start;
      gap: 8px;
      line-height: 1.5;
      overflow-wrap: anywhere;
    }

    .error-msg ion-icon {
      font-size: 19px;
      flex-shrink: 0;
      margin-top: 1px;
    }

    /* PRIMARY BUTTON */

    .btn-mobile-primary {
      width: 100%;
      min-height: 49px;
      padding: 13px 16px;
      background: linear-gradient(135deg,#7955F5,#6038D6);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      transition: transform .15s, opacity .2s;
      margin-top: 5px;
      box-shadow: 0 5px 13px rgba(112,71,245,.20);
    }

    .btn-mobile-primary:active {
      transform: scale(.98);
    }

    .btn-mobile-primary:disabled {
      background: #B6A8EB;
      opacity: .75;
      cursor: not-allowed;
      box-shadow: none;
    }

    /* DIVIDER */

    .divider {
      display: flex;
      align-items: center;
      text-align: center;
      margin: 22px 0;
      color: #A5A1AF;
      font-size: 11px;
    }

    .divider::before,
    .divider::after {
      content: '';
      flex: 1;
      border-bottom: 1px solid #EEEAF4;
    }

    .divider span {
      padding: 0 12px;
    }

    /* BIOMETRIC BUTTON */

    .btn-biometric {
      width: 100%;
      min-height: 65px;
      padding: 10px 14px;
      background: #F8F6FF;
      color: #393544;
      border: 1px solid #E5DDFB;
      border-radius: 13px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 13px;
      text-align: left;
      transition: all .2s ease;
      font-family: inherit;
    }

    .btn-biometric:active {
      background: #F0EBFF;
      transform: scale(.99);
    }

    .btn-biometric:disabled {
      opacity: .5;
      cursor: not-allowed;
    }

    .fingerprint-icon {
      font-size: 34px;
      color: #7047F5;
      flex-shrink: 0;
    }

    .biometric-text {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .biometric-text strong {
      font-size: 13px;
      font-weight: 700;
      color: #393544;
    }

    .biometric-text small {
      font-size: 10px;
      color: #918BA0;
      line-height: 1.4;
    }

    .biometric-arrow {
      font-size: 18px;
      color: #9187AA;
      flex-shrink: 0;
    }

    /* AUTH TOGGLE */

    .toggle-auth {
      text-align: center;
      font-size: 12px;
      color: #777284;
      margin-top: 22px;
      margin-bottom: 18px;
    }

    .toggle-auth span {
      color: #7047F5;
      font-weight: 750;
      cursor: pointer;
      margin-left: 3px;
    }

    .form-footer {
      text-align: center;
      margin-top: auto;
      padding-top: 8px;
      font-size: 10px;
      color: #B0ACB9;
      letter-spacing: .5px;
    }

    /* SMALL MOBILE */

    @media (max-width: 360px) {

      .brand-header {
        padding: 23px 14px 28px;
      }

      .logo-circle {
        width: 55px;
        height: 55px;
        border-radius: 17px;
      }

      .poultry-logo {
        width: 37px;
        height: 37px;
      }

      .brand-header h1 {
        font-size: 26px;
      }

      .poultry-decoration span {
        font-size: 29px;
      }

      .form-sheet {
        padding: 23px 16px 16px;
      }

      .form-heading h2 {
        font-size: 21px;
      }

      .input-wrapper,
      .password-wrapper {
        min-height: 46px;
        padding: 0 10px;
      }

      .input-wrapper input,
      .password-wrapper input {
        font-size: 13px;
      }

      .biometric-text strong {
        font-size: 12px;
      }

      .biometric-text small {
        font-size: 9px;
      }
    }

    /* TABLET AND DESKTOP */

    @media (min-width: 768px) {

      .mobile-app-container {
        justify-content: center;
        align-items: center;
        padding: 25px 16px;
        background:
          radial-gradient(
            circle at top left,
            #9479F8,
            transparent 45%
          ),
          linear-gradient(135deg,#6843E5,#4D2DBB);
      }

      .brand-header {
        width: 100%;
        max-width: 440px;
        border-top-left-radius: 25px;
        border-top-right-radius: 25px;
        padding: 30px 20px 27px;
      }

      .form-sheet {
        flex: initial;
        width: 100%;
        max-width: 440px;
        min-height: 420px;
        border-radius: 0 0 25px 25px;
        padding: 30px;
      }
    }

  `]
})

export class LoginComponent {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  loginForm: FormGroup;

  showPassword = false;
  isRegister = false;
  isLoading = false;
  errorMsg = '';

  constructor() {

    this.loginForm = this.fb.group({

      name: [
        '',
        [Validators.required]
      ],

      email: [
        '',
        [
          Validators.required,
          Validators.email
        ]
      ],

      password: [
        '',
        [
          Validators.required,
          Validators.minLength(6)
        ]
      ]

    });

    // Name is required only during registration.
    this.loginForm.get('name')?.clearValidators();
    this.loginForm.get('name')?.updateValueAndValidity();

  }

  // SWITCH BETWEEN LOGIN AND REGISTER

  toggleAuth(): void {

    this.isRegister = !this.isRegister;

    this.errorMsg = '';
    this.showPassword = false;

    if (this.isRegister) {

      this.loginForm.get('name')?.setValidators([
        Validators.required
      ]);

    } else {

      this.loginForm.get('name')?.clearValidators();

    }

    this.loginForm.get('name')?.updateValueAndValidity();

    this.loginForm.reset();

  }

  // LOGIN / REGISTER

  async onSubmit(): Promise<void> {

    if (this.loginForm.invalid || this.isLoading) {

      this.loginForm.markAllAsTouched();
      return;

    }

    this.isLoading = true;
    this.errorMsg = '';

    const {
      email,
      password,
      name
    } = this.loginForm.value;

    try {

      if (this.isRegister) {

        await this.authService.register(
          email,
          password,
          name?.trim() || 'User'
        );

      } else {

        await this.authService.login(
          email,
          password
        );

      }

    } catch (error: any) {

      this.errorMsg =
        error?.message ||
        'Authentication failed. Please check your credentials.';

    } finally {

      this.isLoading = false;

    }

  }

  // BIOMETRIC SUPPORT CHECK

  async loginWithBiometric(): Promise<void> {

    if (this.isLoading || this.isRegister) {
      return;
    }

    this.errorMsg = '';

    // WebAuthn requires HTTPS or localhost.
    if (!window.isSecureContext) {

      this.errorMsg =
        'Biometric authentication requires HTTPS or localhost.';

      return;

    }

    // Check browser support.
    if (
      !window.PublicKeyCredential ||
      !navigator.credentials
    ) {

      this.errorMsg =
        'Biometric authentication is not supported by this browser or device.';

      return;

    }

    this.isLoading = true;

    try {

      const biometricAvailable =
        await window.PublicKeyCredential
          .isUserVerifyingPlatformAuthenticatorAvailable();

      if (!biometricAvailable) {

        this.errorMsg =
          'Fingerprint, Face ID or device authentication is not available on this device.';

        return;

      }

      /*
       * IMPORTANT:
       * This only confirms that the device supports a platform
       * authenticator. It does not authenticate the user.
       *
       * Actual biometric login requires:
       * 1. Passkey/WebAuthn registration.
       * 2. A server-generated authentication challenge.
       * 3. Server-side credential verification.
       * 4. Firebase Authentication integration.
       */

      this.errorMsg =
        'Your device supports biometric authentication, but biometric login has not yet been connected to your account. Please use your email and password for now.';

    } catch (error: any) {

      this.errorMsg =
        error?.message ||
        'Unable to check biometric authentication on this device.';

    } finally {

      this.isLoading = false;

    }

  }

}
