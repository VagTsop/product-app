import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { SharedModule } from './shared.module';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LoginComponent } from './my-components/login/login.component';
import { ProductDetailsComponent } from './my-components/product-details/product-details.component';
import { ProductListComponent } from './my-components/product-list/product-list.component';


@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    ProductDetailsComponent,
    ProductListComponent
  ],
  imports: [
    HttpClientModule,
    BrowserAnimationsModule,
    BrowserModule,
    SharedModule,
  ],

  bootstrap: [AppComponent]
})
export class AppModule { }
