import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductListComponent } from './my-components/product-list/product-list.component';
import { ProductDetailsComponent } from './my-components/product-details/product-details.component';

const routes: Routes = [
  { path: 'product-list', component: ProductListComponent },
  { path: 'products/:id', component: ProductDetailsComponent }, // Route for Product Details
  { path: '**', redirectTo: 'product-details' } // Handle unknown paths if needed
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
