import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './dashboard/home/home.component';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';
import { AdminHomeComponent } from './dashboard/admin-home/admin-home.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth',
    pathMatch: "full"
  },
  {
    path:'home',
    component: HomeComponent
  },
   {
    path:'admin-home',
    component: AdminHomeComponent
  },
  {
    path:'admin',
    loadChildren:() => import('./modules/admin/admin.module').then(admin=>admin.AdminModule),
    // canActivate: [adminGuard]
  },
  {
    path:'auth',
    loadChildren:() => import('./modules/auth/auth.module').then(auth=>auth.AuthModule)
  },
  {
    path:'products',
    loadChildren:() => import('./modules/products/products.module').then(product=>product.ProductsModule),
    canActivate: [authGuard]
  },
  {
    path:'cart',
    loadChildren:() => import('./modules/cart/cart.module').then(cart=>cart.CartModule),
    canActivate: [authGuard]
  },
  {
    path:'orders',
    loadChildren:() => import('./modules/orders/orders.module').then(order=>order.OrdersModule),
    canActivate: [authGuard]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
