import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../../services/product.service';
import { ToastService } from '../../../services/toast.service';
import { environment } from '../../../../environments/environment';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-product-list',
  standalone: false,
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss'
})
export class ProductListComponent implements OnInit {
  public products: any[] = [];
  public loading: boolean = false;

  constructor(
    private productService:ProductService,
    private toastService:ToastService,
    private router: Router,
    private authService: AuthService
  ) {

  }

  ngOnInit(): void {
    this.loadProducts();
  }

  addToCart(productId: string): void {
    const user = this.authService.getUser();
    if (!user) {
      this.toastService.error('Please login to add items to cart');
      this.router.navigate(['/auth/login']);
      return;
    }

    this.router.navigate(['/cart/add-to-cart'], {
      queryParams: {
        fkUserId: user._id,
        fkProductId: productId
      }
    });
  }

  loadProducts(): void {
    this.loading = true;

    this.productService.getProducts().subscribe({
      next: (response: any) => {
        if (response.statusCode === 200) {
          this.products = response.data || [];
          this.toastService.success(response.message || 'Products loaded successfully');
        } else {
          this.toastService.error(response.message);
        }
        this.loading = false;
      },
      error: (error) => {
        this.toastService.error('Failed to load products');
        this.loading = false;
      }
    });
  }

  getImageUrl(imageUrl: string): string {
    if (!imageUrl) {
      return 'assets/images/placeholder.png';
    }

    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    return environment.baseUrl + imageUrl;
  }

  formatPrice(price: number): string {
    return `₹${price.toFixed(2)}`;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

isNew(createdOn: string): boolean {
  if (!createdOn) return false;

  const productDate = new Date(createdOn);
  const now = new Date();
  const daysDifference = (now.getTime() - productDate.getTime()) / (1000 * 3600 * 24);
  return daysDifference <= 7;
}

}
