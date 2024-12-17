import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'; // Import NgbActiveModal
import { Users } from 'src/app/models/users';

@Component({
  selector: 'app-view-user-profile',
  templateUrl: './view-user-profile.component.html',
  styleUrls: ['./view-user-profile.component.css']
})
export class ViewUserProfileComponent implements OnInit {
  @Input() user!: Users; // User data passed from parent component
  documentLinks: string[] = [];

  // Inject NgbActiveModal to control the modal
  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit(): void {
    // Ensure the document is an array and assign it to documentLinks
    if (this.user.document) {
      this.documentLinks = this.user.document; // Now documentLinks is an array of URLs
    }
  }
}
