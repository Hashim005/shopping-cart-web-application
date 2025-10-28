import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../../services/product.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-orders',
  standalone: false,
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit {
  orders: any[] = [];
  loading = false;
  filterQuery = '';
  filterStatus: string | null = null;
  counts = {
    total: 0,
    pending: 0,
    confirmed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0
  };

  selectedOrder: any = null; // for modal

  statusOptions = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

  constructor(private productService: ProductService, private toast: ToastService) {}

  ngOnInit(): void {
    // initial load with empty payload as requested
    this.searchOrders();
  }

  searchOrders(): void {
    this.loading = true;
    const payload: any = {};
    if (this.filterQuery && this.filterQuery.trim().length > 0) {
      payload.query = this.filterQuery.trim();
    }
    if (this.filterStatus) {
      payload.status = this.filterStatus;
    }

    this.productService.searchUsersOrder(payload).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res && res.statusCode === 200) {
          this.orders = res.data || [];
          this.updateCounts();
        } else {
          this.toast.error(res?.message || 'Failed to fetch orders');
        }
      },
      error: (err) => {
        this.loading = false;
        this.toast.error('Failed to fetch orders');
      }
    });
  }

  private updateCounts(): void {
    this.counts.total = this.orders.length;
    this.counts.pending = this.orders.filter(o => (o.status || '').toLowerCase() === 'pending').length;
    this.counts.confirmed = this.orders.filter(o => (o.status || '').toLowerCase() === 'confirmed').length;
    this.counts.shipped = this.orders.filter(o => (o.status || '').toLowerCase() === 'shipped').length;
    this.counts.delivered = this.orders.filter(o => (o.status || '').toLowerCase() === 'delivered').length;
    this.counts.cancelled = this.orders.filter(o => (o.status || '').toLowerCase() === 'cancelled').length;
  }

  viewOrder(orderId: string): void {
    if (!orderId) return;
    this.productService.getSpecificOrderUser({ _id: orderId }).subscribe({
      next: (res: any) => {
        if (res && res.statusCode === 200) {
          this.selectedOrder = res.data;
        } else {
          this.toast.error(res?.message || 'Failed to load order details');
        }
      },
      error: () => this.toast.error('Failed to load order details')
    });
  }

  closeModal(): void {
    this.selectedOrder = null;
  }

  changeStatus(order: any, status: string): void {
    if (!order || !order._id) return;
    const payload = { _id: order._id, status };
    this.productService.updateUserOrder(payload).subscribe({
      next: (res: any) => {
        if (res && res.statusCode === 200) {
          this.toast.success(res.message || 'Order status updated');
          // update local copy
          const idx = this.orders.findIndex(o => o._id === order._id);
          if (idx > -1) this.orders[idx].status = status;
          this.updateCounts();
        } else {
          this.toast.error(res?.message || 'Failed to update order status');
        }
      },
      error: () => this.toast.error('Failed to update order status')
    });
  }

  removeOrder(order: any): void {
    if (!order || !order._id) return;
    if (!confirm('Are you sure you want to remove this order?')) return;
    this.productService.removedUserOrder({ _id: order._id }).subscribe({
      next: (res: any) => {
        if (res && res.statusCode === 200) {
          this.orders = this.orders.filter(o => o._id !== order._id);
          this.updateCounts();
          this.toast.success(res.message || 'Order removed');
        } else {
          this.toast.error(res?.message || 'Failed to remove order');
        }
      },
      error: () => this.toast.error('Failed to remove order')
    });
  }

}
