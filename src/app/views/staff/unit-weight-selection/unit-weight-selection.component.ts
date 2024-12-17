import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-unit-weight-selection',
  templateUrl: './unit-weight-selection.component.html',
  styleUrls: ['./unit-weight-selection.component.css']
})
export class UnitWeightSelectionComponent {
  @Input() product: any; // Product object with weightPricing and other details
  @Input() isVariation: boolean = false; // Indicates if this is for a variation
  @Output() selectionConfirmed: EventEmitter<any> = new EventEmitter(); // Emits the selected option

  selectedOption: string = ''; // No option selected by default

  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit() {
    console.log('Product received in modal:', this.product);
  }

  // Method to set the selected option without closing the modal
  selectOption(option: string) {
    this.selectedOption = option;
  }

  // Finalize the selection and close the modal
  onSelectOption() {
    if (!this.selectedOption) {
      alert('Please select a purchase type!');
      return;
    }

    if (this.selectedOption === 'Weight-Based') {
      const weightPricing = this.product.weightPricing;

      // Ensure weightPricing is valid and has stock available
      if (!weightPricing || weightPricing.remainingWeight <= 0) {
        alert('Insufficient stock available for weight-based purchase.');
        return;
      }

      // Emit the weight-based selection
      this.activeModal.close({
        selectedOption: this.selectedOption,
        selectedWeight: 1, // Default to 1 (you can enhance this later for custom input)
        weightPricing: weightPricing // Pass weightPricing details
      });
    } else if (this.selectedOption === 'Unit-Based') {
      // Emit the unit-based selection
      this.activeModal.close({
        selectedOption: this.selectedOption,
        selectedWeight: null, // Weight is irrelevant for unit-based
        weightPricing: null
      });
    }
  }
}
