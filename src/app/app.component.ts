import { NZ_I18N, pt_BR } from 'ng-zorro-antd/i18n';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { APP_ROUTES } from 'src/app/app.routes';
import { IconsProviderModule } from 'src/app/icons-provider.module';

import { CommonModule, registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import pt from '@angular/common/locales/pt';
import { Component, importProvidersFrom } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication, BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, RouterModule } from '@angular/router';

registerLocaleData(pt);

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzLayoutModule,
    NzMenuModule,
    IconsProviderModule,
  ],
})
export class AppComponent {
  isCollapsed = false;

  public static bootstrap() {
    bootstrapApplication(this, {
      providers: [
        { provide: NZ_I18N, useValue: pt_BR },
        provideRouter(APP_ROUTES),
        provideHttpClient(),
        importProvidersFrom([
          ReactiveFormsModule,
          BrowserModule,
          FormsModule,
          BrowserAnimationsModule,
        ]),
      ],
    }).catch((err) => console.error(err));
  }
}
