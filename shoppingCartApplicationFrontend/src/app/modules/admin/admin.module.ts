import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminLoginComponent } from './admin-login/admin-login.component';
import { FormsModule } from '@angular/forms';
import { AddProductComponent } from './add-product/add-product.component';
import { OrdersComponent } from './orders/orders.component';
import { AdminHomeComponent } from '../../dashboard/admin-home/admin-home.component';
import { AppModule } from '../../app.module';


@NgModule({
  declarations: [
    AdminLoginComponent,
    AddProductComponent,
    OrdersComponent,
    AdminHomeComponent


  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
    FormsModule,
  ],
   exports: [
      AddProductComponent  ,
    ]
})
export class AdminModule { }
