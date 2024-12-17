import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { TargetSales } from 'src/app/models/sales/target-sales';
import { TargetSalesService } from 'src/app/services/target-sales.service';

@Component({
  selector: 'app-add-target-sales',
  templateUrl: './add-target-sales.component.html',
  styleUrls: ['./add-target-sales.component.css'],
})
export class AddTargetSalesComponent {
  targetForm = new FormGroup({
    target: new FormControl(0, Validators.required),
    month: new FormControl('', Validators.required),
    year: new FormControl('', Validators.required),
  });

  constructor(
    private targetSalesService: TargetSalesService,
    private toartr: ToastrService
  ) {}

  submitForm() {
    if (this.targetForm.valid) {
      let target = this.targetForm.controls.target.value ?? 0;
      let month = this.targetForm.controls.month.value ?? '';
      let year = this.targetForm.controls.year.value ?? '';

      let targetSales: TargetSales = {
        id: `${month}-${year}`,
        sale: +target,
        month: month,
        year: year,
      };
      this.saveTargetSales(targetSales);
    }
  }
  saveTargetSales(target: TargetSales) {
    this.targetSalesService
      .addTargetSales(target)
      .then(() => this.toartr.success('Successfully Added!'))
      .catch((err) => this.toartr.error(err.toString()));
  }
}
