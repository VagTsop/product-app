import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
})
export class ProductListComponent implements OnInit, OnDestroy {
  groupedProducts: any = {};

  colorMapping: { [key: string]: string } = {
    'CURRENT ACCOUNT': '#961B92',
    'LOAN': '#38B7FF;',
    'CREDIT CARD': '#5AB970'
  };

  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.http.get<any[]>('/assets/data/product-list.json').subscribe((data) => {
      this.groupProductsByTitle(data);
    });
  }

  groupProductsByTitle(products: any[]): void {
    this.groupedProducts = products.reduce((grouped, product) => {
      const title = product.title;
      if (!grouped[title]) {
        grouped[title] = [];
      }
      grouped[title].push(product);
      console.log(grouped)
      return grouped;
    }, {});
  }

  onProductClick(product: any): void {
    this.router.navigate(['/products', product.id], { state: { product } }); // Pass full product as state
  }
  ngOnDestroy() { }
}
