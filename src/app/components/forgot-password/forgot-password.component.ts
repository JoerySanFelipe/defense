import { Component } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css'],
})
export class ForgotPasswordComponent {
  email = '';
  constructor(
    private authService: AuthService,
    private toastr: ToastrService
  ) {}
  sendPasswordReset() {
    this.authService
      .forgotPassword(this.email)
      .then(() => this.toastr.success(`an email sent to : ${this.email}`))
      .catch((err) => this.toastr.error(err));
  }
}
