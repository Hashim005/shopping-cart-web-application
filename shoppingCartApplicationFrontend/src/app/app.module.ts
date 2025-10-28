import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule, provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ToastComponent } from './shared/toast/toast.component';
import { HomeComponent } from './dashboard/home/home.component';
import { FormsModule } from '@angular/forms';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { AdminHomeComponent } from './dashboard/admin-home/admin-home.component';
import { AdminModule } from './modules/admin/admin.module';
import { RouterOutlet } from '@angular/router';


@NgModule({
  declarations: [
    AppComponent,
    ToastComponent,
    HomeComponent,


  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    AdminModule,
    RouterOutlet
  ],
  providers: [
    provideClientHydration(withEventReplay()),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor])
    )
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
