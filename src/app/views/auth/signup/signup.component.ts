import { Component, Input, inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Users } from 'src/app/models/users';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
})
export class SignupComponent {
  activeModal = inject(NgbActiveModal);
  @Input() users!: Users;
  registerForm: FormGroup;
  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,

    private authService: AuthService
  ) {
    this.registerForm = new FormGroup({});
  }
  ngOnInit(): void {
    this.registerForm = this.fb.group({
      email: [this.users.email, Validators.required],
      password: ['', Validators.required],
    });
  }
  register() {
    let email = this.registerForm.controls['email'].value ?? this.users.email;
    let password = this.registerForm.controls['password'].value ?? '12345678';
    this.authService
      .signup(email, password)
      .then(() => {
        this.authService.setUsers(this.users);
        this.activeModal.close();
      })
      .catch((err) => {
        this.toastr.error(err.toString());
      });
  }
}
