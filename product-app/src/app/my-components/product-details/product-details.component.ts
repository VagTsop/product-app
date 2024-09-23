import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-product-details',
  templateUrl: './product-details.component.html',
})
export class ProductDetailsComponent implements OnInit {
  productId: string | null = null;
  product: any = null;
  searchQuery: string = '';
  transactions: any[] = [];
  filteredResults: any[] = [];

  constructor(private http: HttpClient,
    private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id');
    this.product = history.state.product;
    if (!this.product) {
      console.log('Product was not passed in state. Fetch it using productId:', this.productId);
    } else {
      console.log('Product details:', this.product);
    }

    this.loadTransactions();
  }

  loadTransactions(): void {
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
