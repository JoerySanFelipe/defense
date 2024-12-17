import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { environment } from '../environments/environment';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { LoginComponent } from './views/auth/login/login.component';
import { SignupComponent } from './views/auth/signup/signup.component';
import { AdminMainComponent } from './views/admin/admin-main/admin-main.component';
import { StaffMainComponent } from './views/staff/staff-main/staff-main.component';
import { ReactiveFormsModule } from '@angular/forms';
import { NotFoundComponent } from './views/not-found/not-found.component';
import { DashboardComponent } from './views/admin/dashboard/dashboard.component';
import { ProductComponent } from './views/inventory/product/product.component';
import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PrimaryButtonComponent } from './components/primary-button/primary-button.component';
import { HeaderComponent } from './components/header/header.component';
import { ReportsComponent } from './views/admin/reports/reports.component';
import { CustomerComponent } from './views/admin/customer/customer.component';
import { OrdersComponent } from './views/admin/orders/orders.component';
import { UsersComponent } from './views/admin/user/users/users.component';
import { AuditComponent } from './views/admin/audit/audit.component';
import { ContentsComponent } from './views/admin/contents/contents.component';
import { ViewProductComponent } from './views/inventory/view-product/view-product.component';
import { AddUserComponent } from './views/admin/user/add-user/add-user.component';
import { AddProductComponent } from './views/inventory/add-product/add-product.component';
import { AddVariationComponent } from './views/inventory/add-variation/add-variation.component';
import { DeleteProductDialogComponent } from './components/delete-product-dialog/delete-product-dialog.component';
import { CustomerInfoComponent } from './components/customer-info/customer-info.component';
import { StaffHomeComponent } from './views/staff/staff-home/staff-home.component';
import { TransactionsComponent } from './views/staff/transactions/transactions.component';
import { ConfirmCheckoutComponent } from './views/staff/confirm-checkout/confirm-checkout.component';
import { ViewOrdersComponent } from './views/staff/view-orders/view-orders.component';

import { FormsModule } from '@angular/forms';
import { AddTopicComponent } from './views/admin/add-topic/add-topic.component';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { NgChartsModule, NgChartsConfiguration } from 'ng2-charts';
import { ReviewTransactionComponent } from './views/admin/review-transaction/review-transaction.component';
import { StaffInfoComponent } from './components/staff-info/staff-info.component';
import { ProfileComponent } from './components/profile/profile.component';
import { AddDriverComponent } from './components/add-driver/add-driver.component';
import { AddPaymentComponent } from './components/add-payment/add-payment.component';
import { ViewAuditComponent } from './views/admin/view-audit/view-audit.component';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
import { EditProductComponent } from './views/inventory/edit-product/edit-product.component';

import { ProductOverviewComponent } from './views/inventory/product-overview/product-overview.component';
import { ProductPurchasesComponent } from './views/inventory/product-purchases/product-purchases.component';
import { ProductAdjustmentsComponent } from './views/inventory/product-adjustments/product-adjustments.component';
import { MessagesComponent } from './views/messages/messages.component';

import { ConversationComponent } from './components/conversation/conversation.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';

import { ViewCustomerProfileComponent } from './views/admin/view-customer-profile/view-customer-profile.component';
import { SettingsComponent } from './views/admin/settings/settings.component';
import { AddTargetSalesComponent } from './components/add-target-sales/add-target-sales.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbModal, NgbModalConfig } from '@ng-bootstrap/ng-bootstrap';
import { NewsletterDialogComponent } from './components/newsletter-dialog/newsletter-dialog.component';
import {
  NgbPaginationModule,
  NgbTypeaheadModule,
} from '@ng-bootstrap/ng-bootstrap';
import { DeclineDialogComponent } from './components/decline-dialog/decline-dialog.component';
import { EditVariationComponent } from './components/edit-variation/edit-variation.component';
import { CommonModule } from '@angular/common';
import { AddStocksComponent } from './components/add-stocks/add-stocks.component';
import { LogoutComponent } from './components/logout/logout.component';
import { EditProfileComponent } from './components/edit-profile/edit-profile.component';
import { AdminTransactionsComponent } from './views/admin/admin-transactions/admin-transactions.component';
import { DeleteVariationConfirmationComponent } from './components/delete-variation-confirmation/delete-variation-confirmation.component';
import { ViewTopicComponent } from './views/view-topic/view-topic.component';
import { AddContentComponent } from './views/admin/add-content/add-content.component';
import { CreateSubjectComponent } from './views/admin/create-subject/create-subject.component';
import { DeleteConfirmationComponent } from './components/delete-confirmation/delete-confirmation.component';
import { EditContentComponent } from './components/edit-content/edit-content.component';
import { EditTopicComponent } from './components/edit-topic/edit-topic.component';
import { NewsletterComponent } from './views/admin/newsletter/newsletter.component';
import { ViewNewsletterComponent } from './components/view-newsletter/view-newsletter.component';
import { EditNewsletterComponent } from './components/edit-newsletter/edit-newsletter.component';
import { StoreModule } from '@ngrx/store';

import { isDevMode } from '@angular/core';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { EffectsModule } from '@ngrx/effects';
import {
  contentFeatureKey,
  contentReducer,
} from './views/admin/contents/store/reducers';
import { ContentEffects } from './views/admin/contents/store/effects';

import { OrderDialogComponent } from './views/staff/order-dialog/order-dialog.component';
import { AddGcashPaymentComponent } from './components/add-gcash-payment/add-gcash-payment.component';
import {
  settingsFeatureKey,
  settingsReducer,
} from './views/admin/settings/store/settings.reducers';
import { SettingsEffect } from './views/admin/settings/store/settings.effects';
import { DateRangeFilterPipe } from './pipes/date-range-filter.pipe';
import { AddprodAddvarComponent } from './views/inventory/addprod-addvar/addprod-addvar.component';
import { UnitWeightSelectionComponent } from './views/staff/unit-weight-selection/unit-weight-selection.component';
import { ViewUserProfileComponent } from './views/admin/user/view-user-profile/view-user-profile.component';
@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    SignupComponent,
    AdminMainComponent,
    StaffMainComponent,
    NotFoundComponent,
    DashboardComponent,
    ProductComponent,
    PrimaryButtonComponent,
    HeaderComponent,
    AddStocksComponent,
    ReportsComponent,
    CustomerComponent,
    OrdersComponent,
    UsersComponent,
    AuditComponent,
    ContentsComponent,
    ViewProductComponent,
    AddUserComponent,
    AddProductComponent,
    AddVariationComponent,
    DeleteProductDialogComponent,
    CustomerInfoComponent,
    StaffHomeComponent,
    TransactionsComponent,
    ConfirmCheckoutComponent,
    ViewOrdersComponent,
    AddTopicComponent,
    ReviewTransactionComponent,
    StaffInfoComponent,
    ProfileComponent,
    AddDriverComponent,
    AddPaymentComponent,
    ViewAuditComponent,
    EditProductComponent,
    ProductOverviewComponent,
    ProductPurchasesComponent,
    ProductAdjustmentsComponent,
    MessagesComponent,
    ConversationComponent,
    ForgotPasswordComponent,
    ViewCustomerProfileComponent,
    SettingsComponent,
    AddTargetSalesComponent,
    NewsletterDialogComponent,
    DeclineDialogComponent,
    EditVariationComponent,
    LogoutComponent,
    EditProfileComponent,
    AdminTransactionsComponent,
    DeleteVariationConfirmationComponent,
    ViewTopicComponent,
    AddContentComponent,
    CreateSubjectComponent,
    DeleteConfirmationComponent,
    EditContentComponent,
    EditTopicComponent,
    NewsletterComponent,
    ViewNewsletterComponent,
    EditNewsletterComponent,
    OrderDialogComponent,
    AddGcashPaymentComponent,
    DateRangeFilterPipe,
    AddprodAddvarComponent,
    UnitWeightSelectionComponent,
    ViewUserProfileComponent,
  ],
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    CommonModule,
    FormsModule,
    NgbPaginationModule,
    NgxJsonViewerModule,
    NgbTypeaheadModule,
    NgxDaterangepickerMd.forRoot(),
    NgChartsModule.forRoot({ defaults: {} }),
    AppRoutingModule,
    ReactiveFormsModule,
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
    ToastrModule.forRoot(),
    StoreModule.forRoot(),
    StoreModule.forFeature(contentFeatureKey, contentReducer),

    StoreModule.forFeature(settingsFeatureKey, settingsReducer),
    EffectsModule.forFeature([ContentEffects, SettingsEffect]),
    StoreDevtoolsModule.instrument({
      maxAge: 25,
      logOnly: !isDevMode(),
      autoPause: true,
      trace: false,
      traceLimit: 75,
    }),

    NgbModule,
    EffectsModule.forRoot([]),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
