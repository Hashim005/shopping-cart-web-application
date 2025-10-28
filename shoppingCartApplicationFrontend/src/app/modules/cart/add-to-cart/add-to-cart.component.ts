import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../services/product.service';
import { ToastService } from '../../../services/toast.service';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-add-to-cart',
  standalone: false,
  templateUrl: './add-to-cart.component.html',
  styleUrls: ['./add-to-cart.component.scss']
})
export class AddToCartComponent implements OnInit, OnDestroy {
  public userId: string | null = null;
  public productId: string | null = null;
  private destroy$ = new Subject<void>();
  private paramsProcessed = false;

  public cartItems: any[] = [];
  public loading = false;
  public shipping = 10;
  public taxRate = 0.05;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private toastService: ToastService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Get query parameters and also load cart for current user when none provided
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        // Prevent double-processing
        if (this.paramsProcessed) return;
        this.paramsProcessed = true;

        this.userId = params['fkUserId'] || null;
        this.productId = params['fkProductId'] || null;

        const storedUser = this.authService.getUser();
        const userIdToLoad = (storedUser && storedUser._id) ? storedUser._id : this.userId;

        if (this.userId && this.productId) {
          // If query params provided, add that product then load cart
          this.addToCartInternal(this.userId, this.productId, () => {
            if (userIdToLoad) this.loadCart(userIdToLoad);
          });
        } else if (userIdToLoad) {
          // No query params: just load cart for logged-in user
          this.loadCart(userIdToLoad);
        } else {
          this.toastService.error('Please login to view your cart');
          this.router.navigate(['/auth/login']);
        }
      });
  }

  private addToCartInternal(userId: string, productId: string, cb?: () => void): void {
    const postObj = {
      fkUserId: userId,
      fkProductId: productId
    };

    this.productService.addToCart(postObj).subscribe({
      next: (response: any) => {
        if (response && response.statusCode === 200) {
          this.toastService.success(response.message || 'Product added to cart successfully');
          if (cb) cb();
        } else {
          this.toastService.error(response?.message || 'Failed to add product to cart');
        }
      },
      error: (error) => {
        this.toastService.error('Failed to add product to cart');
      }
    });
  }

  loadCart(userId: any): void {
    this.loading = true;
    const userObj = {
      fkUserId:userId
    }
    this.productService.getCart(userObj).subscribe({
      next: (res: any) => {
        if (res && res.statusCode === 200) {
          this.cartItems = res.data || [];
        } else {
          this.toastService.error(res?.message || 'Failed to load cart');
        }
        this.loading = false;
      },
      error: (err) => {
        this.toastService.error('Failed to load cart');
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

  // Compute subtotal
  get subtotal(): number {
    return this.cartItems.reduce((sum, item) => {
      return sum + (item.totalPrice || 0);
    }, 0);
  }

  get tax(): number {
    return parseFloat((this.subtotal * this.taxRate).toFixed(2));
  }

  get total(): number {
    return parseFloat((this.subtotal + this.shipping + this.tax).toFixed(2));
  }

  increaseQty(item: any): void {
    const newQty = (item.quantity ?? 1) + 1;
    this.updateCartItemQuantity(item._id, newQty);
  }

  decreaseQty(item: any): void {
    const newQty = Math.max(1, (item.quantity ?? 1) - 1);
    this.updateCartItemQuantity(item._id, newQty);
  }

  private updateCartItemQuantity(cartItemId: string, quantity: number): void {
    const item = this.cartItems.find(i => i._id === cartItemId);
    if (item) {
      item.quantity = quantity;
      item.totalPrice = item.unitPrice * quantity;
    }
  }

  removeItem(item: any): void {
    const cartItemId = item?.cartItemId || item?._id || item?.id;
    if (!cartItemId) {
      this.toastService.error('Invalid cart item id');
      return;
    }

    this.productService.productRemoveFromCart({ cartItemId }).subscribe({
      next: (res: any) => {
        if (res && res.statusCode === 200) {
          this.cartItems = this.cartItems.filter(ci => (ci.cartItemId || ci._id || ci.id) !== cartItemId);
          this.toastService.success(res.message || 'Item removed from cart');
        } else {
          this.toastService.error(res?.message || 'Failed to remove item');
        }
      },
      error: (err) => {
        this.toastService.error('Failed to remove item');
      }
    });
  }

  proceedToCheckout(): void {
    const storedUser = this.authService.getUser();
    const fkUserId = (storedUser && storedUser._id) ? storedUser._id : this.userId;

    if (!fkUserId) {
      this.toastService.error('Please login to proceed to checkout');
      this.router.navigate(['/auth/login']);
      return;
    }

    if (!this.cartItems || this.cartItems.length === 0) {
      this.toastService.error('Your cart is empty');
      return;
    }

    const products: Array<{ fkProductId: string; quantity: number }> = [];

    for (const item of this.cartItems) {
      const fkProductId = item?.fkProductId || item?.product?._id || item?.productId || item?.fkProduct;
      const quantity = item?.quantity ?? 1;

      if (!fkProductId) {
        this.toastService.error('product data is required');
        return;
      }

      products.push({ fkProductId: String(fkProductId), quantity });
    }

    const payload = { fkUserId: String(fkUserId), products };

    this.loading = true;
    this.productService.createOrders(payload).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res && res.statusCode === 200) {
          this.toastService.success(res.message || 'Order created successfully');
          const orderId = res?.data?.orderId || null;
          this.cartItems = [];
          if (orderId) {
            this.router.navigate(['/orders', orderId]);
          } else {
            this.router.navigate(['/orders']);
          }
        } else {
          this.toastService.error(res?.message || 'Failed to create order');
        }
      },
      error: (err) => {
        this.loading = false;
        this.toastService.error('Failed to create order');
      }
    });
  }

  continueShopping(): void {
    this.router.navigate(['/products']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
