import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.css'],
})
export class LogoutComponent {
  activeModal = inject(NgbActiveModal);
  constructor(private authService: AuthService, private router: Router) {}
  logout() {
    this.authService.logout();
    this.activeModal.close();
    this.router.navigate(['login']);
  }
}
