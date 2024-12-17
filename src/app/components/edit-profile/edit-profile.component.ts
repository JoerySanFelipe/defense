import { Component, Input, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Users } from 'src/app/models/users';
import { AuthService } from 'src/app/services/auth.service';
import { LoadingService } from 'src/app/services/loading.service';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.css'],
})
export class EditProfileComponent implements OnInit {
  activeModal = inject(NgbActiveModal);

  @Input() users!: Users;
  userForm$: FormGroup;
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    public loadingService: LoadingService,
    private toastr: ToastrService
  ) {
    this.userForm$ = fb.group({
      name: ['', Validators.required],
      address: ['', Validators.required],
      phone: ['', [Validators.required, phoneValidator]],
    });
  }
  ngOnInit(): void {
    this.userForm$ = this.fb.group({
      name: [this.users.name, Validators.required],
      address: [this.users.address, Validators.required],
      phone: [this.users.phone, [Validators.required, phoneValidator]],
    });
  }
  onSubmit() {
    if (this.userForm$.valid) {
      const name: string = this.userForm$.get('name')?.value ?? '';
      const address: string = this.userForm$.get('address')?.value ?? '';
      const phone: string = this.userForm$.get('phone')?.value ?? '';
      if (this.users === null) {
        this.toastr.warning('User not found!');
        return;
      }
      this.loadingService.showLoading('user');
      this.authService
        .updateProfile(this.users.id, name, address, phone)
        .then((data) => {
          this.users.name = name;
          this.users.address = address;
          this.users.phone = phone;
          this.authService.setUsers(this.users);
          this.toastr.success('Successfully Updated');
        })
        .catch((err) => {
          this.toastr.error(err['message'].toString());
        })
        .finally(() => {
          this.loadingService.hideLoading('user');
          this.userForm$.reset();
          this.activeModal.close();
        });
    }
  }
}
function phoneValidator(control: FormControl) {
  const value = control.value;
  if (value && value.length === 11 && value.startsWith('09')) {
    return null; // No error, the phone number is valid
  }
  return { invalidPhone: true }; // Return an error object if the phone number is invalid
}
