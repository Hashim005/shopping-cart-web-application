import { Component } from '@angular/core';
import { ToastService } from '../../../services/toast.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ProductService } from '../../../services/product.service';

@Component({
  selector: 'app-add-product',
  standalone: false,
  templateUrl: './add-product.component.html',
  styleUrl: './add-product.component.scss'
})
export class AddProductComponent {
  public product: any = {
    name: '',
    description: '',
    price: null,
    imageUrl: ''
  };

  public imagePreview: string | null = null;
  public selectedFile: File | null = null;


  constructor(
    private router: Router,
    private toastService: ToastService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    // Component initialization
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.handleFile(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  handleFile(file: File): void {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.toastService.showError('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      this.toastService.showError('Image size must be less than 5MB');
      return;
    }

    this.selectedFile = file;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imagePreview = e.target.result;
      this.product.imageUrl = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  removeImage(event: Event): void {
    event.stopPropagation();
    this.imagePreview = null;
    this.selectedFile = null;
    this.product.imageUrl = '';
    this.toastService.showInfo('Image removed');
  }

  addProduct(): void {
    // Validation
    if (!this.product.name || !this.product.name.trim()) {
      this.toastService.showError('Product name is required');
      return;
    }

    if (!this.product.description || !this.product.description.trim()) {
      this.toastService.showError('Product description is required');
      return;
    }

    if (!this.product.price || this.product.price <= 0) {
      this.toastService.showError('Valid price is required');
      return;
    }

    // Prepare product data
    const productData = {
      name: this.product.name.trim(),
      description: this.product.description.trim(),
      price: parseFloat(this.product.price.toString()),
      imageUrl: this.product.imageUrl,
      // status: 'available',
    };

    // Send to backend
    this.productService.productCreation(productData).subscribe({
      next: (res: any) => {
        if (res.statusCode === 201 ){
          this.toastService.showSuccess(res.message);
          this.resetForm();
        } else {
          this.toastService.error(res.message);
        }
      },
      error: (error) => {
          this.toastService.showError('Failed to add product. Please try again.');
        }
    });
  }

  resetForm(): void {
    this.product = {
      name: '',
      description: '',
      price: 0,
      imageUrl: ''
    };
    this.imagePreview = null;
    this.selectedFile = null;
    this.toastService.showInfo('Form has been reset');
  }

}
