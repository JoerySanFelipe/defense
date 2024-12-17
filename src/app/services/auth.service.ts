import { Injectable } from '@angular/core';
import {
  Auth,
  User,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  user,
} from '@angular/fire/auth';
import {
  Firestore,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { Users, userConverter } from '../models/users';
import { collectionData, docData } from 'rxfire/firestore';
import {
  BehaviorSubject,
  Observable,
  catchError,
  from,
  switchMap,
  throwError,
} from 'rxjs';
import {
  Storage,
  getDownloadURL,
  ref,
  uploadBytes,
} from '@angular/fire/storage';

import { v4 as uuidv4 } from 'uuid';
import { UserType } from '../models/user-type';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  _collection_name = 'users';
  private usersSubject: BehaviorSubject<Users | null> =
    new BehaviorSubject<Users | null>(null);
  public users$: Observable<Users | null> = this.usersSubject.asObservable();

  private userListSubject: BehaviorSubject<Users[]> = new BehaviorSubject<
    Users[]
  >([]);
  public usersList$: Observable<Users[]> = this.userListSubject.asObservable();
  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private storage: Storage
  ) {}

  setUsers(user: Users): void {
    this.usersSubject.next(user);
  }

  setUserList(users: Users[]) {
    this.userListSubject.next(users);
  }
  getCurrentUser() {
    return user(this.auth);
  }
  login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }
  createAccount(email: string, password: string) {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  getUserByEmail(email: string) {
    const q = query(
      collection(this.firestore, this._collection_name),
      where('email', '==', email),
      limit(1)
    ).withConverter(userConverter);
    return getDocs(q);
  }

  saveUserAccount(users: Users) {
    return setDoc(
      doc(collection(this.firestore, this._collection_name), users.id),
      users
    );
  }
  getAllUsers(): Observable<Users[]> {
    return collectionData(
      collection(this.firestore, this._collection_name)
    ) as Observable<Users[]>;
  }

  updateUserAccount(users: Users) {
    return setDoc(
      doc(collection(this.firestore, this._collection_name), users.id),
      users
    );
  }

  getAllDrivers() {
    const q = query(
      collection(this.firestore, this._collection_name),
      where('type', '==', UserType.DRIVER)
    );
    return collectionData(q) as Observable<Users[]>;
  }
  forgotPassword(email: string) {
    return sendPasswordResetEmail(this.auth, email);
  }

  async uploadProfile(file: File) {
    try {
      const user = this.auth.currentUser;
      if (user) {
        const fireRef = ref(
          this.storage,
          `${user.uid}/${this._collection_name}/${uuidv4()}`
        );

        await uploadBytes(fireRef, file);
        const downloadURL = await getDownloadURL(fireRef);
        return downloadURL;
      } else {
        throw new Error('No user signed in.');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  editProfile(id: string, url: string) {
    return updateDoc(
      doc(collection(this.firestore, this._collection_name), id),
      { profile: url }
    );
  }
  logout() {
    this.auth.signOut();
  }
  signup(email: string, password: string) {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  deleteAccount(id: string) {
    return deleteDoc(
      doc(collection(this.firestore, this._collection_name), id)
    );
  }

  getUserByID(id: string): Observable<Users> {
    return docData(
      doc(this.firestore, this._collection_name, id).withConverter(
        userConverter
      )
    ) as Observable<Users>;
  }

  updateProfile(userID: string, name: string, address: string, phone: string) {
    return updateDoc(doc(this.firestore, this._collection_name, userID), {
      name: name,
      phone: phone,
      address: address,
    });
  }
}