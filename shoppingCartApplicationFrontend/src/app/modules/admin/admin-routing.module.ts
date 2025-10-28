import { NgModule, Component } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminLoginComponent } from './admin-login/admin-login.component';
import { AddProductComponent } from './add-product/add-product.component';
import { OrdersComponent } from './orders/orders.component';

const routes: Routes = [
  {
    path:'',
    redirectTo:'admin-login',
    pathMatch:"full"
  },
  {
    path:'admin-login',
    component:AdminLoginComponent
  },
  {
    path:'product-create',
    component:AddProductComponent
  },
  {
    path:'orders',
    component:OrdersComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
