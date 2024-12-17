import { Location } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { Users } from 'src/app/models/users';
import { AuthService } from 'src/app/services/auth.service';
import { EditProfileComponent } from '../edit-profile/edit-profile.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { use } from 'echarts';
import { ToastrService } from 'ngx-toastr';
import { LogoutComponent } from '../logout/logout.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit, OnDestroy {
  private modalService = inject(NgbModal);
  _users: Users | null = null;
  private userSub$: Subscription;
  constructor(
    private authService: AuthService,
    private location: Location,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {
    this.userSub$ = new Subscription();
  }

  ngOnInit(): void {
    this.authService.users$.subscribe((data) => {
      this._users = data;
    });
  }
  listenToUser(userID: string) {
    this.userSub$ = this.authService.getUserByID(userID).subscribe((data) => {
      this.authService.setUsers(data);
      this._users = data;
    });
  }
  ngOnDestroy(): void {
    this.userSub$.unsubscribe();
  }

  logout() {
    this.modalService.open(LogoutComponent);
  }

  editProfile() {
    const modal = this.modalService.open(EditProfileComponent);
    modal.componentInstance.users = this._users;
  }
  onFileChange(event: Event) {
    const fileInput = event.target as HTMLInputElement;

    // Check if a file was selected
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      this.saveProfile(file);
    }
  }
  saveProfile(file: File) {
    if (this._users !== null) {
      this.authService.uploadProfile(file).then((data) => {
        this.authService.editProfile(this._users?.id ?? '', data).then(() => {
          this._users!.profile = data;
          this.authService.setUsers(this._users!);
        });
      });
    }
  }
}
