import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './views/auth/login/login.component';
import { AdminMainComponent } from './views/admin/admin-main/admin-main.component';
import { StaffMainComponent } from './views/staff/staff-main/staff-main.component';
import { SignupComponent } from './views/auth/signup/signup.component';
import { NotFoundComponent } from './views/not-found/not-found.component';
import { DashboardComponent } from './views/admin/dashboard/dashboard.component';

import { ProductComponent } from './views/inventory/product/product.component';
import { ReportsComponent } from './views/admin/reports/reports.component';
import { CustomerComponent } from './views/admin/customer/customer.component';
import { OrdersComponent } from './views/admin/orders/orders.component';
import { UsersComponent } from './views/admin/user/users/users.component';
import { AuditComponent } from './views/admin/audit/audit.component';
import { ContentsComponent } from './views/admin/contents/contents.component';
import { AddProductComponent } from './views/inventory/add-product/add-product.component';
import { StaffHomeComponent } from './views/staff/staff-home/staff-home.component';
import { TransactionsComponent } from './views/staff/transactions/transactions.component';
import { ReviewTransactionComponent } from './views/admin/review-transaction/review-transaction.component';
import { ProfileComponent } from './components/profile/profile.component';
import { ViewAuditComponent } from './views/admin/view-audit/view-audit.component';
import { ViewProductComponent } from './views/inventory/view-product/view-product.component';
import { EditProductComponent } from './views/inventory/edit-product/edit-product.component';
import { MessagesComponent } from './views/messages/messages.component';
import { ViewCustomerProfileComponent } from './views/admin/view-customer-profile/view-customer-profile.component';
import { SettingsComponent } from './views/admin/settings/settings.component';
import { AdminTransactionsComponent } from './views/admin/admin-transactions/admin-transactions.component';
import { ViewTopicComponent } from './views/view-topic/view-topic.component';
import { NewsletterDialogComponent } from './components/newsletter-dialog/newsletter-dialog.component';
import { NewsletterComponent } from './views/admin/newsletter/newsletter.component';
const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'notfound', component: NotFoundComponent },
  { path: 'signup', component: SignupComponent },
  {
    path: 'admin',
    component: AdminMainComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'inventory', component: ProductComponent },
      { path: 'view-product/:id', component: ViewProductComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'customer', component: CustomerComponent },
      { path: 'view-profile', component: ViewCustomerProfileComponent },
      { path: 'orders', component: OrdersComponent },
      { path: 'settings', component: SettingsComponent },
      { path: 'messages', component: MessagesComponent },
      { path: 'transactions', component: AdminTransactionsComponent },
      { path: 'newsletter', component: NewsletterComponent },
      {
        path: 'review-transactions/:id',
        component: ReviewTransactionComponent,
      },
      { path: 'users', component: UsersComponent },
      { path: 'audit', component: AuditComponent },
      {
        path: 'view-audit/:id',
        component: ViewAuditComponent,
      },
      { path: 'contents', component: ContentsComponent },
      { path: 'contents/:id', component: ViewTopicComponent },
      { path: 'add-product', component: AddProductComponent },
      { path: 'edit-product', component: EditProductComponent },
      {
        path: 'profile',
        component: ProfileComponent,
      },
    ],
  },

  {
    path: 'staff',
    component: StaffMainComponent,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: StaffHomeComponent },
      { path: 'inventory', component: ProductComponent },
      { path: 'add-product', component: AddProductComponent },
      { path: 'edit-product', component: EditProductComponent },
      { path: 'view-product/:id', component: ViewProductComponent },
      { path: 'orders', component: OrdersComponent },
      { path: 'messages', component: MessagesComponent },
      { path: 'profile', component: ProfileComponent },
      {
        path: 'transactions',
        component: TransactionsComponent,
      },
      {
        path: 'review-transactions/:id',
        component: ReviewTransactionComponent,
      },
    ],
  },

  {
    path: 'messages',
    component: MessagesComponent,
  },
  {
    path: 'profile',
    component: ProfileComponent,
  },
  { path: 'login', component: LoginComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
