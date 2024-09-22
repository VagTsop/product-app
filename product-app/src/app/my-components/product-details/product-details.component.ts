import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-product-details',
  templateUrl: './product-details.component.html',
})
export class ProductDetailsComponent implements OnInit {
  productId: string | null = null;
  product: any = null; // Define a variable to hold the product details

  constructor(private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    // Get the product ID from the route parameters
    this.productId = this.route.snapshot.paramMap.get('id');

    // Retrieve the product from the state passed during navigation
    this.product = history.state.product;

    // Check if product was passed, else fetch it based on ID (optional fallback)
    if (!this.product) {
      // Fetch the product from a service using the productId
      console.log('Product was not passed in state. Fetch it using productId:', this.productId);
    } else {
      console.log('Product details:', this.product);
    }
  }
}
