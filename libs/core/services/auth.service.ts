import { Injectable, NgZone } from '@angular/core';
import { auth } from 'firebase/app';
import { User } from "../models/user.interface";
import { Router } from "@angular/router";
import { AngularFireAuth } from "@angular/fire/auth";
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { Subject } from 'rxjs';
import { FirebaseDynamicLinks } from '@ionic-native/firebase-dynamic-links/ngx';


@Injectable({
  providedIn: 'root'
})

export class AuthenticationService {
  userData: any;
  provider: string;

  authProviderSubject = new Subject<any>();

  constructor(
    public afStore: AngularFirestore,
    public ngFireAuth: AngularFireAuth,
    public router: Router,  
    public ngZone: NgZone,
    private firebaseDynamicLinks: FirebaseDynamicLinks 
  ) {
    this.ngFireAuth.authState.subscribe(user => {
      if (user) {
        this.userData = user;
        localStorage.setItem('user', JSON.stringify(this.userData));
        JSON.parse(localStorage.getItem('user'));
      } else {
        localStorage.setItem('user', null);
        JSON.parse(localStorage.getItem('user'));
      }
    });

    // Handle the logic here after opening the app with the Dynamic link
    this.firebaseDynamicLinks.onDynamicLink()
    .subscribe((res: any) => console.log(res), (error:any) => console.log(error));
  }

  // Login in with email/password
  SignIn(email, password) {
    return this.ngFireAuth.signInWithEmailAndPassword(email, password);
  }

  // Register user with email/password
  RegisterUser(email, password) {
    return this.ngFireAuth.createUserWithEmailAndPassword(email, password);
  }

  // Email verification when new user register
  SendVerificationMail() {
    return this.ngFireAuth.onAuthStateChanged((user) => {
        user.sendEmailVerification();
    }).then(() => {
    })
  }

  // Recover password
  PasswordRecover(passwordResetEmail) {
    return this.ngFireAuth.sendPasswordResetEmail(passwordResetEmail)
    .then(() => {
      window.alert('Password reset email has been sent, please check your inbox.');
    }).catch((error) => {
      window.alert(error)
    }) 
  }

  // Returns true when user is looged in
  get isLoggedIn(): boolean {
    const user = JSON.parse(localStorage.getItem('user'));
    return (user !== null && (user.emailVerified !== false || this.provider == 'facebook.com')) ? true : false;
  }

  // Returns true when user's email is verified
  get isEmailVerified(): boolean {
    const user = JSON.parse(localStorage.getItem('user'));
    return (user.emailVerified !== false) ? true : false;
  }

  // Sign in with Gmail
  GoogleAuth() {
    return this.AuthLogin(new auth.GoogleAuthProvider());
  }

  FacebookAuth() {
    return this.AuthLogin(new auth.FacebookAuthProvider());
  }

  // Auth providers
  AuthLogin(provider) {
    return this.ngFireAuth.signInWithPopup(provider)
    .then((result) => {
      console.log(result);
      this.authProviderSubject.next(true);
      this.SetUserData(result.user);
      this.provider = result.additionalUserInfo.providerId;
    }).catch((error) => {
      this.authProviderSubject.next(error);
      window.alert(error);
    })
  }

  // Store user in localStorage
  SetUserData(user) {
    const userRef: AngularFirestoreDocument<any> = this.afStore.doc(`users/${user.uid}`);
    const userData: User = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified
    }
    return userRef.set(userData, {
      merge: true
    })
  }

  // Sign-out 
  SignOut() {
    return this.ngFireAuth.signOut().then(() => {
      localStorage.removeItem('user');
      this.router.navigate(['account']);
    })
  }

  resetPasswordInit(email: string) {
    return this.ngFireAuth.sendPasswordResetEmail(email);
  }

}