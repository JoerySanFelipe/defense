import { Component, OnInit, inject } from '@angular/core';
import { FirebaseError } from '@angular/fire/app';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { UserType } from 'src/app/models/user-type';
import { Users } from 'src/app/models/users';
import { AuthService } from 'src/app/services/auth.service';
import { LoadingService } from 'src/app/services/loading.service';
import { SignupComponent } from '../signup/signup.component';
import { use } from 'echarts';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,

    private router: Router,
    public loadingService: LoadingService,
    private toastr: ToastrService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]],
    });
  }
  ngOnInit(): void {
    console.log('test');
    this.authService.getCurrentUser().subscribe((data) => {
      this.getUserByEmail(data?.email ?? '');
    });
  }

  getUserByEmail(email: string) {
    this.loadingService.showLoading('login');
    this.authService
      .getUserByEmail(email)
      .then((data) => {
        if (!data.empty) {
          const doc = data.docs[0];
          const user = doc.data();
          this.authService.setUsers(user);

          this.loadingService.hideLoading('login');
          this.identifyUser(user.type);
        }
      })
      .catch((err) => {
        this.toastr.success(err.toString());
        this.loadingService.hideLoading('login');
      })
      .finally(() => {
        this.loadingService.hideLoading('login');
      });
  }
  identifyUser(type: UserType) {
    if (type === UserType.ADMIN) {
      this.router.navigate(['admin']);
    } else if (type === UserType.STAFF) {
      this.router.navigate(['staff']);
    }
  }
  onSubmit() {
    if (this.loginForm.valid) {
      let email = this.loginForm.controls['email'].value;
      let password = this.loginForm.controls['password'].value;
      this.authService
        .getUserByEmail(email)
        .then((data) => {
          if (!data.empty) {
            const doc = data.docs[0];
            const user = doc.data();
            this.authService
              .login(email, password)
              .then((task) => {
                this.authService.setUsers(user);
                this.toastr.success('Successfully Logged in');
              })
              .catch((err: FirebaseError) => {
                console.log(err);
                if (err.code == 'auth/user-not-found') {
                  if (user.type === UserType.DRIVER) {
                    this.toastr.error(
                      'You are not allowed to create an account'
                    );
                    return;
                  }
                  this.registerUser(user);
                  return;
                }
                this.toastr.error(err['message']);
              });
          } else {
            this.toastr.error('User not found!');
          }
        })
        .catch((err) => {
          console.log(err);
          this.toastr.error(err.toString());
        });
    } else {
      this.toastr.error('Unknown error!');
    }
  }
  private modalService = inject(NgbModal);
  registerUser(user: Users) {
    const modalRef = this.modalService.open(SignupComponent);
    modalRef.componentInstance.users = user;
  }
}
