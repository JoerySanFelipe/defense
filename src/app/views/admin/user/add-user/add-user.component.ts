import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { v4 as uuidv4 } from 'uuid';
import {
  Storage,
  ref,
  uploadBytes,
  getDownloadURL,
} from '@angular/fire/storage';
import { UserType } from 'src/app/models/user-type';
import { Users } from 'src/app/models/users';
import { AuthService } from 'src/app/services/auth.service';
import { LoadingService } from 'src/app/services/loading.service';

@Component({
  selector: 'app-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.css'],
})
export class AddUserComponent {
  activeModal = inject(NgbActiveModal);
  userTypes$ = Object.values(UserType);
  users$: Users[] = [];
  userForm = new FormGroup({
    name: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    address: new FormControl('', Validators.required),
    type: new FormControl(null, Validators.required),
    phone: new FormControl('', [
      Validators.required,
      Validators.pattern(/^(9\d{9})$/),
    ]),
    document: new FormControl<File[]>([], Validators.required),
  });

  constructor(
    private authService: AuthService,
    private toastr: ToastrService,
    public loadingService: LoadingService,
    private storage: Storage // Inject Firebase Storage
  ) {}

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleMultipleFileSelection(files);
    }
  }

  handleMultipleFileSelection(files: FileList): void {
    const documentControl = this.userForm.controls['document'];

    // Reset previous errors
    documentControl.setErrors(null);

    // Create an array to hold valid files
    const validFiles: File[] = [];
    const existingFiles = documentControl.value || [];

    for (const file of Array.from(files)) {
      // Check file size
      if (file.size > 5 * 1024 * 1024) {
        documentControl.setErrors({ fileSizeExceeded: true });
        this.toastr.error('One or more files exceed the 5MB size limit');
        return;
      }

      // Check for allowed file types (JPEG, PNG, PDF)
      if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
        documentControl.setErrors({ fileInvalid: true });
        this.toastr.error(
          'One or more files have invalid file types. Only JPEG/PNG/PDF are allowed'
        );
        return;
      }

      validFiles.push(file);
    }

    // Append valid files to existing ones
    const allFiles = [...existingFiles, ...validFiles];
    documentControl.setValue(allFiles);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  // Remove document from the form control
  removeDocument(file: File): void {
    const documents = this.userForm.controls['document'].value as File[];
    const index = documents.indexOf(file);
    if (index > -1) {
      documents.splice(index, 1); // Remove the file from the array
      this.userForm.controls['document'].setValue([...documents]); // Update the form control
    }
  }

  onSelectDocument(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.handleFileSelection(files);
    }
  }

  onClickUpload(event: MouseEvent): void {
    event.stopPropagation(); // Prevent the click from reaching the file input
  }

  handleFileSelection(files: FileList): void {
    const documentControl = this.userForm.controls['document'];

    // Reset previous errors
    documentControl.setErrors(null);

    // Create an array to hold valid files
    const validFiles: File[] = [];

    for (const file of Array.from(files)) {
      // Check file size
      if (file.size > 5 * 1024 * 1024) {
        documentControl.setErrors({ fileSizeExceeded: true });
        this.toastr.error('One or more files exceed the 5MB size limit');
        return;
      }

      // Check for allowed file types (JPEG, PNG, PDF)
      if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
        documentControl.setErrors({ fileInvalid: true });
        this.toastr.error(
          'One or more files have invalid file types. Only JPEG/PNG/PDF are allowed'
        );
        return;
      }

      validFiles.push(file);
    }

    // If no valid files were selected, show the required error
    if (validFiles.length === 0) {
      documentControl.setErrors({ required: true });
    } else {
      // Set the valid files array to the form control
      documentControl.setValue(validFiles);
    }
  }

  submitUser() {
    if (this.userForm.valid) {
      const { name, email, address, type, phone, document } =
        this.userForm.controls;

      const emailExists = this.users$.some(
        (user) => user.email === email.value
      );

      if (emailExists) {
        this.toastr.warning('Email exists');
        return;
      }

      const newUser: Users = {
        id: uuidv4(),
        name: name.value ?? '',
        profile: '',
        phone: '+63' + phone.value, // Prepend +63 to the phone number
        email: email.value ?? '',
        address: address.value ?? '',
        type: this.getUserType(type.value ?? 'staff'),
        document: [], // Initialize as an empty array for document URLs
      };

      // Ensure that the document is not null before calling uploadDocument
      const files = document.value; // This is now an array of File
      if (!files || files.length === 0) {
        this.toastr.error('Please upload a document');
        return;
      }

      // Save the user account and upload documents
      this.saveAccount(newUser, files);
    }
  }

  getUserType(type: string): UserType {
    if (type === 'staff') {
      return UserType.STAFF;
    } else if (type === 'admin') {
      return UserType.ADMIN;
    } else {
      return UserType.DRIVER;
    }
  }

  saveAccount(user: Users, documents: File[]) {
    this.loadingService.showLoading('user');

    // Upload all the documents and get their URLs
    Promise.all(documents.map((file) => this.uploadDocument(file)))
      .then((documentURLs) => {
        // Set the document URLs array in the user object
        user.document = documentURLs; // Store as an array of URLs

        this.authService
          .saveUserAccount(user)
          .then(() => {
            this.toastr.success('New user created!', 'Successfully created');
          })
          .catch((err) =>
            this.toastr.error(err.message, 'Error saving account')
          )
          .finally(() => {
            this.loadingService.hideLoading('user');
            this.activeModal.close();
          });
      })
      .catch((err) => {
        this.toastr.error('Error uploading document(s): ' + err.message);
        this.loadingService.hideLoading('user');
      });
  }

  // Upload the document to Firebase Storage
  async uploadDocument(file: File): Promise<string> {
    const documentId = uuidv4();
    const documentRef = ref(
      this.storage,
      `users/scanned-documents/${documentId}`
    );
    try {
      await uploadBytes(documentRef, file);
      const documentURL = await getDownloadURL(documentRef);
      return documentURL;
    } catch (error) {
      throw new Error('Failed to upload document');
    }
  }
}
