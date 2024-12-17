import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';
import { Users } from './models/users';
import { user } from 'rxfire/auth';
import { AuditLogService } from './services/audit-log.service';
import { MessagesService } from './services/messages.service';
import { User } from '@angular/fire/auth';
import { use } from 'echarts';
import { UserType } from './models/user-type';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'Agritech';
  constructor(private authService: AuthService, private router: Router) {
    authService.getCurrentUser().subscribe((data) => {
      if (data !== null) {
        this.getUserByEmail(data.email ?? '');
      }
    });
  }

  getUserByEmail(email: string) {
    this.authService
      .getUserByEmail(email)
      .then((data) => {
        if (!data.empty) {
          const doc = data.docs[0];
          const user = doc.data();
          this.authService.setUsers(user);

          this.identifyUser(user.type);
        }
      })
      .catch((err) => {})
      .finally(() => {});
  }
  identifyUser(type: UserType) {
    if (type === UserType.ADMIN) {
      this.router.navigate(['admin']);
    } else if (type === UserType.STAFF) {
      this.router.navigate(['staff']);
    }
  }
}
