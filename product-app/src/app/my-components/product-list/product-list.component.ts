import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
})
export class ProductListComponent implements OnInit, OnDestroy {
  groupedProducts: any = {};

  constructor(private http: HttpClient) { }

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

  ngOnDestroy() { }
}
