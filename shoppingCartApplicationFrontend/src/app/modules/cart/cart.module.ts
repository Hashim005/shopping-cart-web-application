import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CartRoutingModule } from './cart-routing.module';
import { AddToCartComponent } from './add-to-cart/add-to-cart.component';


@NgModule({
  declarations: [
    AddToCartComponent
  ],
  imports: [
    CommonModule,
    CartRoutingModule,
  ]
})
export class CartModule { }
