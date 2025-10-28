import { NgModule } from '@angular/core';
import { ServerModule } from '@angular/platform-server';
import { provideServerRouting } from '@angular/ssr';
import { AppComponent } from './app.component';
import { AppModule } from './app.module';
import { serverRoutes } from './app.routes.server';
import { provideHttpClient, withFetch } from '@angular/common/http';

@NgModule({
  imports: [AppModule, ServerModule ],
  providers: [provideServerRouting(serverRoutes),
    provideHttpClient(withFetch())
  ],

  bootstrap: [AppComponent],
})
export class AppServerModule {}
