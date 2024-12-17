import { Component, inject, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NewsLetter } from 'src/app/models/newsletter';

@Component({
  selector: 'app-view-newsletter',
  templateUrl: './view-newsletter.component.html',
  styleUrls: ['./view-newsletter.component.css'],
})
export class ViewNewsletterComponent {
  @Input() newsletter: NewsLetter | undefined;
  activeModal  = inject(NgbActiveModal)

  
}
