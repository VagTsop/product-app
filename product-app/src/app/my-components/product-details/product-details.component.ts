import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-product-details',
  templateUrl: './product-details.component.html',
})
export class ProductDetailsComponent implements OnInit {
  productId: string | null = null;
  product: any = null; // Define a variable to hold the product details
  searchQuery: string = '';
  transactions: any[] = []; // To store the fetched transactions
  filteredResults: any[] = [];

  constructor(private http: HttpClient, // Inject HttpClient service
    private route: ActivatedRoute, private router: Router) { }

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

    this.loadTransactions();

  }

  loadTransactions(): void {
    // Fetch the JSON file with transactions
    this.http.get<any[]>('/assets/data/transactions.json').subscribe((data) => {
      this.transactions = data;
      this.filteredResults = data; // Initially show all transactions
    });
  }

  onSearch(): void {
    if (this.searchQuery.length > 0) {
      this.filteredResults = this.transactions.filter((transaction) =>
        transaction.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        transaction.subtitle.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        transaction.referenceNumber.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    } else {
      this.filteredResults = this.transactions;
    }
  }
}
