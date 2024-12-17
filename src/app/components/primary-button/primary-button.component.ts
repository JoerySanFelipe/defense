import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LoadingService } from 'src/app/services/loading.service';

@Component({
  selector: 'app-primary-button',
  templateUrl: './primary-button.component.html',
  styleUrls: ['./primary-button.component.css'],
})
export class PrimaryButtonComponent {
  @Input() label: string = '';
  @Input() key!: string;
  @Input() loadingLabel: string = '';
  @Input() isFull!: boolean;
  @Input() isDisable!: boolean;
  @Input() type!: string;
  @Output() onClick: EventEmitter<void> = new EventEmitter<void>();
  constructor(public loadingService: LoadingService) {}
  handleClick() {
    this.onClick.emit();
  }
}
