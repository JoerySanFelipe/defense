import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import { Users } from 'src/app/models/users';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-add-driver',
  templateUrl: './add-driver.component.html',
  styleUrls: ['./add-driver.component.css'],
})
export class AddDriverComponent implements OnInit {
  _drivers: Users[] = [];
  activeModal = inject(NgbActiveModal);
  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}
  ngOnInit(): void {
    this.authService.getAllDrivers().subscribe((data) => {
      this._drivers = data;
      this.cdr.detectChanges();
    });
  }

  selectDriver(data: Users) {
    this.activeModal.close(data);
  }
}
