
import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { UserProfile } from '../../models/model';

import { updateProfile } from '@angular/fire/auth';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-my-profile',
  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],

  schemas: [CUSTOM_ELEMENTS_SCHEMA],

  template: `
    <div class="page-header">
      <a routerLink="/home" class="back-btn">
        <ion-icon name="arrow-back-outline"></ion-icon>
      </a>
      My Profile
    </div>

    <div class="page-container">

      <form
        [formGroup]="profileForm"
        (ngSubmit)="onSubmit()"
      >

        <div class="form-group">
          <label>Full Name</label>
          <input
            type="text"
            formControlName="displayName"
            placeholder="Enter your full name"
          />
          <small
            *ngIf="
              profileForm.get('displayName')?.touched &&
              profileForm.get('displayName')?.invalid
            "
          >
            Full name is required.
          </small>
        </div>

        <div class="form-group">
          <label>Email</label>
          <input
            type="email"
            formControlName="email"
            readonly
            style="background: #eee;"
          />
        </div>

        <div class="form-group">
          <label>Phone Number</label>
          <input
            type="tel"
            formControlName="phoneNumber"
            placeholder="Enter phone number"
          />
        </div>

        <div class="form-group">
          <label>Business Name</label>
          <input
            type="text"
            formControlName="businessName"
            placeholder="Enter your business name"
          />
          <small
            *ngIf="
              profileForm.get('businessName')?.touched &&
              profileForm.get('businessName')?.invalid
            "
          >
            Business name is required.
          </small>
        </div>

        <div class="form-group">
          <label>Business Address</label>
          <input
            type="text"
            formControlName="businessAddress"
            placeholder="Enter business address"
          />
        </div>

        <div class="form-group">
          <label>Business Type</label>
          <input
            type="text"
            formControlName="businessType"
            placeholder="e.g. Poultry Farm"
          />
        </div>

        <button
          type="submit"
          class="btn-primary"
          [disabled]="saving || profileForm.invalid"
        >
          {{ saving ? 'Updating...' : 'Update Profile' }}
        </button>

      </form>

      <button
        class="btn-danger"
        style="margin-top: 12px;"
        type="button"
        (click)="authService.logout()"
      >
        Logout
      </button>

    </div>
  `
})
export class MyProfileComponent implements OnInit, OnDestroy {

  private fb = inject(FormBuilder);
  private dataService = inject(DataService);
  private firebaseAuth = inject(Auth);

  public authService = inject(AuthService);

  profileForm!: FormGroup;

  userId = '';
  saving = false;

  private subscriptions = new Subscription();
  private profileSubscription?: Subscription;

  ngOnInit(): void {

    this.profileForm = this.fb.group({

      uid: [''],

      displayName: ['', Validators.required],

      email: [''],

      phoneNumber: [''],

      businessName: ['', Validators.required],

      businessAddress: [''],

      businessType: ['']

    });

    this.subscriptions.add(

      this.authService.currentUser$.subscribe(user => {

        if (!user) {

          this.userId = '';

          this.profileSubscription?.unsubscribe();

          this.profileForm.reset();

          return;
        }

        this.userId = user.uid;

        this.profileForm.patchValue({

          uid: user.uid,

          displayName: user.displayName || '',

          email: user.email || ''

        });

        this.loadProfile(user.uid);

      })

    );

  }

  // ==========================================
  // LOAD USER PROFILE
  // ==========================================

  loadProfile(uid: string): void {

    this.profileSubscription?.unsubscribe();

    this.profileSubscription =
      this.dataService.getUserProfile(uid).subscribe({

        next: (profile: UserProfile | null) => {

          if (!profile) {
            return;
          }

          this.profileForm.patchValue({

            uid: uid,

            displayName: profile.displayName || '',

            email: profile.email || '',

            phoneNumber: profile.phoneNumber || '',

            businessName: profile.businessName || '',

            businessAddress: profile.businessAddress || '',

            businessType: profile.businessType || ''

          });

        },

        error: error => {

          console.error('Error loading profile:', error);

        }

      });

  }

  // ==========================================
  // UPDATE USER PROFILE
  // ==========================================

  async onSubmit(): Promise<void> {

    if (!this.userId || this.profileForm.invalid || this.saving) {

      this.profileForm.markAllAsTouched();

      return;
    }

    const currentUser = this.firebaseAuth.currentUser;

    if (!currentUser || currentUser.uid !== this.userId) {

      alert('Your session has expired. Please login again.');

      return;
    }

    this.saving = true;

    try {

      const formData = this.profileForm.getRawValue();

      const profileData: Partial<UserProfile> = {

        uid: this.userId,

        displayName: formData.displayName.trim(),

        email: currentUser.email || '',

        phoneNumber: formData.phoneNumber?.trim() || '',

        businessName: formData.businessName.trim(),

        businessAddress: formData.businessAddress?.trim() || '',

        businessType: formData.businessType?.trim() || ''

      };

      // Update Firestore profile.
      await this.authService.updateUserProfile(
        this.userId,
        profileData
      );

      // Update Firebase Authentication display name.
      await updateProfile(currentUser, {
        displayName: profileData.displayName || ''
      });

      alert('Profile updated successfully!');

    } catch (error: any) {

      console.error('Profile Update Error:', error);

      if (error.code === 'permission-denied') {

        alert(
          'Permission denied. Please check your Firestore Security Rules.'
        );

      } else {

        alert('Failed to update profile. Please try again.');

      }

    } finally {

      this.saving = false;

    }

  }

  // ==========================================
  // CLEANUP
  // ==========================================

  ngOnDestroy(): void {

    this.profileSubscription?.unsubscribe();

    this.subscriptions.unsubscribe();

  }

}
