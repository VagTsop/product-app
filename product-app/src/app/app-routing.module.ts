import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductListComponent } from './my-components/product-list/product-list.component';

const routes: Routes = [
  { path: 'product-list', component: ProductListComponent },
  { path: '**', redirectTo: 'product-details' } // Handle unknown paths if needed
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
